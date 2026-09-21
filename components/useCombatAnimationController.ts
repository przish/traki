import { useEffect, useState, useCallback, useRef } from "react";
import { Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { COMBAT_CONFIG } from "@/src/constants/combat";
import { CombatEventBus, CombatEventPayload } from "@/src/services/combatEvents";

export type PlayerCombatState = "IDLE" | "WINDUP" | "STRIKE" | "FOLLOW_THROUGH";
export type TargetCombatState = "IDLE" | "HIT_STUN" | "HURT" | "DEFEATED";
export type SlashFXState = "NONE" | "CRESCENT" | "BURST";

export interface FloatingCombatPopup {
  id: string;
  damageText: string;
  lootText?: string;
  isCrit: boolean;
  comboCount: number;
  animY: Animated.Value;
  animOpacity: Animated.Value;
}

interface UseCombatAnimationControllerOptions {
  activeTier: "daily" | "weekly" | "monthly";
  onHitImpact?: (payload: CombatEventPayload, comboCount: number) => void;
}

/**
 * 2D Combat Stage Animation Controller
 * Designed by King-Julyan (Frontend UI/UX Specialist)
 * Formulated by Julia (Math/Physics) & Kurt-Claude (Event Bus)
 * Guaranteed 60 FPS hardware-accelerated animations (useNativeDriver: true)
 */
export function useCombatAnimationController({
  activeTier,
  onHitImpact,
}: UseCombatAnimationControllerOptions) {
  // State Machines
  const [playerState, setPlayerState] = useState<PlayerCombatState>("IDLE");
  const [targetState, setTargetState] = useState<TargetCombatState>("IDLE");
  const [slashState, setSlashState] = useState<SlashFXState>("NONE");
  const [comboCount, setComboCount] = useState<number>(0);
  const [popups, setPopups] = useState<FloatingCombatPopup[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Hardware-Accelerated Animated Values (React 19 Compliant)
  const [playerTranslateX] = useState(() => new Animated.Value(0));
  const [playerTranslateY] = useState(() => new Animated.Value(0));
  const [playerScale] = useState(() => new Animated.Value(1));
  const [playerRotate] = useState(() => new Animated.Value(0));

  const [targetTranslateX] = useState(() => new Animated.Value(0));
  const [targetTranslateY] = useState(() => new Animated.Value(0));
  const [targetScale] = useState(() => new Animated.Value(1));
  const [targetFlashOpacity] = useState(() => new Animated.Value(0));

  const [slashOpacity] = useState(() => new Animated.Value(0));
  const [slashScale] = useState(() => new Animated.Value(0.4));
  const [slashRotate] = useState(() => new Animated.Value(0));

  const [coinTranslateY] = useState(() => new Animated.Value(0));
  const [coinOpacity] = useState(() => new Animated.Value(0));
  const [stageShakeX] = useState(() => new Animated.Value(0));

  // Internal refs for combo queueing and timer hygiene
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comboResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strikeQueueRef = useRef<CombatEventPayload[]>([]);
  const isExecutingRef = useRef<boolean>(false);
  const comboCountRef = useRef<number>(0);

  // Helper for memory-safe timeouts
  const scheduleTimeout = useCallback((cb: () => void, delayMs: number) => {
    const handle = setTimeout(cb, delayMs);
    timeoutsRef.current.push(handle);
    return handle;
  }, []);

  // Idle Floating Animation Loops (Non-linear sine/quad ease)
  useEffect(() => {
    const playerIdleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(playerTranslateY, {
          toValue: -5,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(playerTranslateY, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const targetIdleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(targetTranslateY, {
          toValue: -7,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(targetTranslateY, {
          toValue: 2,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    playerIdleLoop.start();
    targetIdleLoop.start();

    return () => {
      playerIdleLoop.stop();
      targetIdleLoop.stop();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (comboResetTimerRef.current) {
        clearTimeout(comboResetTimerRef.current);
      }
    };
  }, [playerTranslateY, targetTranslateY]);

  // Process strike ref for recursive combo queue execution without closure cycles
  const processStrikeRef = useRef<(payload: CombatEventPayload, isComboChain: boolean) => void>(() => {});

  // Execute a single strike animation sequence (or combo step)
  const processStrike = useCallback(
    (payload: CombatEventPayload, isComboChain: boolean) => {
      isExecutingRef.current = true;
      setIsAnimating(true);

      // Increment combo count
      const nextCombo = isComboChain
        ? Math.min(comboCountRef.current + 1, COMBAT_CONFIG.COMBO_CONFIG.MAX_COMBO_COUNT)
        : 1;
      comboCountRef.current = nextCombo;
      setComboCount(nextCombo);

      // Reset combo window timer
      if (comboResetTimerRef.current) {
        clearTimeout(comboResetTimerRef.current);
      }
      comboResetTimerRef.current = setTimeout(() => {
        comboCountRef.current = 0;
        setComboCount(0);
      }, COMBAT_CONFIG.COMBO_CONFIG.COMBO_WINDOW_MS);

      const isCrit = payload.strikeResult.isCrit;
      const baseDmg = payload.strikeResult.totalDamage;
      const comboMultiplier = 1 + (nextCombo - 1) * COMBAT_CONFIG.COMBO_CONFIG.COMBO_BONUS_STEP;
      const effectiveDmg = Math.round(baseDmg * comboMultiplier);
      const gold = payload.strikeResult.goldEarned;
      const exp = payload.strikeResult.expEarned;
      const trk = activeTier === "daily" ? 2 : activeTier === "weekly" ? 15 : 50;

      // Create animated floating popup
      const animY = new Animated.Value(0);
      const animOpacity = new Animated.Value(1);
      const popupId = `pop_${Date.now()}_${Math.random()}`;

      const newPopup: FloatingCombatPopup = {
        id: popupId,
        damageText: isCrit
          ? `💥 CRIT! -${effectiveDmg} HP`
          : nextCombo > 1
          ? `⚔️ ${nextCombo}x COMBO! -${effectiveDmg} HP`
          : `⚔️ -${effectiveDmg} HP`,
        lootText: `₱${payload.amount.toLocaleString()} Saved • +${gold} Gold • +${exp} EXP • +${trk} TRK`,
        isCrit,
        comboCount: nextCombo,
        animY,
        animOpacity,
      };

      setPopups((prev) => [...prev.slice(-2), newPopup]);

      // Float damage numbers upward
      Animated.parallel([
        Animated.timing(animY, {
          toValue: -36,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.POPUP_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.POPUP_DURATION_MS,
          delay: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Screen camera shake
      Animated.sequence([
        Animated.timing(stageShakeX, {
          toValue: isCrit ? -9 : -5,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.SHAKE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(stageShakeX, {
          toValue: isCrit ? 9 : 5,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.SHAKE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(stageShakeX, {
          toValue: isCrit ? -5 : -3,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.SHAKE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(stageShakeX, {
          toValue: isCrit ? 5 : 3,
          duration: COMBAT_CONFIG.ANIMATION_PHYSICS.SHAKE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(stageShakeX, { toValue: 0, duration: COMBAT_CONFIG.ANIMATION_PHYSICS.SHAKE_DURATION_MS, useNativeDriver: true }),
      ]).start();

      // Coin particle burst
      coinTranslateY.setValue(0);
      coinOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(coinTranslateY, {
          toValue: -45,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(coinOpacity, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // ─── STATE & SPRITE TIMELINE ───
      // 1. Wind-up state (skip or shorten if in a continuous combo chain)
      const windupDuration = isComboChain ? 30 : COMBAT_CONFIG.ANIMATION_PHYSICS.WINDUP_MS;
      setPlayerState("WINDUP");

      scheduleTimeout(() => {
        setPlayerState("STRIKE");
      }, windupDuration);

      // 2. Exact Timestamp of Impact (Hit Detection)
      const impactTimestamp = isComboChain ? 110 : COMBAT_CONFIG.ANIMATION_PHYSICS.IMPACT_DELAY_MS;
      scheduleTimeout(() => {
        // Emit hit impact callback
        onHitImpact?.(payload, nextCombo);

        try {
          Haptics.impactAsync(isCrit ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        } catch {}

        // Target transitions to HURT / HIT_STUN
        setTargetState("HURT");
        setSlashState("CRESCENT");

        // Slash transitions to BURST
        scheduleTimeout(() => {
          setSlashState("BURST");
        }, COMBAT_CONFIG.SPRITE_ANIMATION.SLASH_FX_FRAME_MS);

        // Slash finishes
        scheduleTimeout(() => {
          setSlashState("NONE");
        }, COMBAT_CONFIG.SPRITE_ANIMATION.SLASH_FX_FRAME_MS * 2.5);

        // Target recovers from hurt stun
        scheduleTimeout(() => {
          setTargetState("IDLE");
        }, COMBAT_CONFIG.ANIMATION_PHYSICS.HIT_STUN_MS);
      }, impactTimestamp);

      // ─── HARDWARE-ACCELERATED TRANSLATION SEQUENCING (60 FPS) ───
      Animated.sequence([
        // 1. Wind-up pull back
        Animated.parallel([
          Animated.timing(playerTranslateX, {
            toValue: -12,
            duration: windupDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(playerScale, {
            toValue: 0.94,
            duration: windupDuration,
            useNativeDriver: true,
          }),
        ]),
        // 2. Forward Lunge Strike
        Animated.parallel([
          Animated.timing(playerTranslateX, {
            toValue: 105,
            duration: COMBAT_CONFIG.ANIMATION_PHYSICS.LUNGE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(playerScale, {
            toValue: 1.25,
            duration: COMBAT_CONFIG.ANIMATION_PHYSICS.LUNGE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(playerRotate, {
            toValue: 1,
            duration: COMBAT_CONFIG.ANIMATION_PHYSICS.LUNGE_MS,
            useNativeDriver: true,
          }),
        ]),
        // 3. Impact Recoil Reaction on Target
        Animated.parallel([
          Animated.sequence([
            Animated.timing(slashOpacity, { toValue: 1, duration: 40, useNativeDriver: true }),
            Animated.timing(slashScale, { toValue: 1.5, duration: 160, useNativeDriver: true }),
            Animated.timing(slashOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          Animated.timing(slashRotate, { toValue: 1, duration: 250, useNativeDriver: true }),
          // Target hit shudder & recoil
          Animated.sequence([
            Animated.parallel([
              Animated.timing(targetTranslateX, { toValue: 26, duration: 55, useNativeDriver: true }),
              Animated.timing(targetFlashOpacity, { toValue: 0.9, duration: 55, useNativeDriver: true }),
              Animated.timing(targetScale, { toValue: 0.88, duration: 55, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(targetTranslateX, { toValue: -8, duration: 75, useNativeDriver: true }),
              Animated.timing(targetFlashOpacity, { toValue: 0, duration: 110, useNativeDriver: true }),
            ]),
            Animated.timing(targetTranslateX, { toValue: 0, duration: 110, useNativeDriver: true }),
            Animated.timing(targetScale, { toValue: 1, duration: 110, useNativeDriver: true }),
          ]),
        ]),
        // 4. Spring Back to Origin Stance (Smooth non-linear dampening)
        Animated.parallel([
          Animated.spring(playerTranslateX, {
            toValue: 0,
            friction: COMBAT_CONFIG.ANIMATION_PHYSICS.RECOVERY_SPRING_FRICTION,
            tension: COMBAT_CONFIG.ANIMATION_PHYSICS.RECOVERY_SPRING_TENSION,
            useNativeDriver: true,
          }),
          Animated.spring(playerScale, {
            toValue: 1,
            friction: COMBAT_CONFIG.ANIMATION_PHYSICS.RECOVERY_SPRING_FRICTION,
            useNativeDriver: true,
          }),
          Animated.timing(playerRotate, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        slashScale.setValue(0.4);
        slashRotate.setValue(0);
        setPlayerState("IDLE");

        // Check if rapid-succession queue has pending strikes (Combo Chain Continuation)
        if (strikeQueueRef.current.length > 0) {
          const nextStrike = strikeQueueRef.current.shift()!;
          processStrikeRef.current(nextStrike, true);
        } else {
          isExecutingRef.current = false;
          setIsAnimating(false);
        }
      });

      // Clear popup after duration
      scheduleTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== popupId));
      }, COMBAT_CONFIG.ANIMATION_PHYSICS.POPUP_DURATION_MS + 200);
    },
    [
      activeTier,
      onHitImpact,
      playerTranslateX,
      playerScale,
      playerRotate,
      targetTranslateX,
      targetFlashOpacity,
      targetScale,
      slashOpacity,
      slashScale,
      slashRotate,
      stageShakeX,
      coinTranslateY,
      coinOpacity,
      scheduleTimeout,
    ]
  );

  useEffect(() => {
    processStrikeRef.current = processStrike;
  }, [processStrike]);

  // Trigger strike entry (handles rapid-succession queueing gracefully)
  const triggerCombatStrike = useCallback(
    (payload: CombatEventPayload) => {
      if (isExecutingRef.current) {
        // Enqueue into combo chain if currently animating
        strikeQueueRef.current.push(payload);
      } else {
        processStrike(payload, false);
      }
    },
    [processStrike]
  );

  // Auto-subscribe to the CombatEventBus tied to ledger logs
  useEffect(() => {
    const unsubscribe = CombatEventBus.subscribe((payload) => {
      triggerCombatStrike(payload);
    });
    return unsubscribe;
  }, [triggerCombatStrike]);

  return {
    // Current States
    playerState,
    targetState,
    slashState,
    comboCount,
    isAnimating,
    popups,

    // Hardware-Accelerated Animated Values
    playerTranslateX,
    playerTranslateY,
    playerScale,
    playerRotate,
    targetTranslateX,
    targetTranslateY,
    targetScale,
    targetFlashOpacity,
    slashOpacity,
    slashScale,
    slashRotate,
    coinTranslateY,
    coinOpacity,
    stageShakeX,

    // Dispatcher
    triggerCombatStrike,
  };
}
