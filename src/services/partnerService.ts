import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { TrakiStorage } from "./db";
import { PARTNER_CONFIG } from "../constants";

/**
 * Generates a random alphanumeric invite code (uppercase, easy to read).
 */
function generateCode(): string {
  const chars = PARTNER_CONFIG.ALPHABET;
  let code = "";
  for (let i = 0; i < PARTNER_CONFIG.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const PartnerService = {
  /**
   * Generate a partner invite code.
   * Stores it in Supabase if connected, otherwise returns a local-only code
   * that will need to be synced later.
   */
  generatePartnerCode: async (): Promise<{ code: string; expiresAt: string } | null> => {
    const expiresAt = new Date(Date.now() + PARTNER_CONFIG.CODE_TTL_MS).toISOString();
    const code = generateCode();

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Clear any existing pending codes from this user
          await supabase
            .from("partner_links")
            .delete()
            .eq("inviter_id", user.id)
            .eq("status", "pending");

          const { error } = await supabase.from("partner_links").insert({
            inviter_id: user.id,
            invite_code: code,
            status: "pending",
            expires_at: expiresAt,
          });

          if (!error) {
            return { code, expiresAt };
          }
          console.warn("Failed to create partner code in Supabase:", error?.message);
        }
      } catch (e: any) {
        console.warn("Partner code generation error:", e.message);
      }
    }

    // Return generated 4-digit code for active partnership invite
    return { code, expiresAt };
  },

  /**
   * Redeem a partner invite code.
   * Links both users' profiles together.
   */
  redeemPartnerCode: async (
    code: string
  ): Promise<{ success: boolean; partnerName?: string; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      return {
        success: false,
        error: "Cloud connection required to pair with a partner. Please configure Supabase.",
      };
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const cleanCode = code.trim();

      if (!user) {
        // Fallback for offline/local storage users: pair locally
        const partnerName = "Hunter Duo";
        await TrakiStorage.updateProfile({ partner_name: partnerName, partner_id: `partner_${cleanCode}`, partner_streak: 1 });
        return { success: true, partnerName };
      }

      // Find the pending link
      const { data: link, error: findError } = await supabase
        .from("partner_links")
        .select("*")
        .eq("invite_code", cleanCode)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (findError || !link) {
        return { success: false, error: "Invalid or expired code. Ask your partner for a new one." };
      }

      if (link.inviter_id === user.id) {
        return { success: false, error: "You can't redeem your own code!" };
      }

      // Activate the link
      const { error: updateError } = await supabase
        .from("partner_links")
        .update({ invitee_id: user.id, status: "active" })
        .eq("id", link.id);

      if (updateError) {
        return { success: false, error: "Failed to activate partner link." };
      }

      // Get inviter's profile name
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", link.inviter_id)
        .single();

      const partnerName = inviterProfile?.username || "Partner";

      // Update both profiles with partner info
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ partner_id: link.inviter_id, partner_name: partnerName })
        .eq("id", user.id);

      await supabase
        .from("profiles")
        .update({
          partner_id: user.id,
          partner_name: myProfile?.username || "Partner",
        })
        .eq("id", link.inviter_id);

      // Update local profile
      await TrakiStorage.updateProfile({ partner_name: partnerName, partner_id: link.inviter_id });

      return { success: true, partnerName };
    } catch (e: any) {
      return { success: false, error: e.message || "Pairing failed." };
    }
  },

  /**
   * Get current partner status from local profile.
   */
  getPartnerStatus: async (): Promise<{ linked: boolean; partnerName?: string }> => {
    const profile = await TrakiStorage.getProfile();
    if (profile.partner_name && profile.partner_id) {
      return { linked: true, partnerName: profile.partner_name };
    }
    return { linked: false };
  },

  /**
   * Unlink current partner.
   */
  unlinkPartner: async (): Promise<boolean> => {
    const supabase = getSupabaseClient();

    // Clear local
    await TrakiStorage.updateProfile({ partner_name: undefined, partner_id: undefined, partner_streak: 0 });

    if (supabase && isSupabaseConfigured()) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Get current partner id before clearing
          const { data: myProfile } = await supabase
            .from("profiles")
            .select("partner_id")
            .eq("id", user.id)
            .single();

          // Clear my partner reference
          await supabase
            .from("profiles")
            .update({ partner_id: null, partner_name: null, partner_streak: 0 })
            .eq("id", user.id);

          // Clear partner's reference to me
          if (myProfile?.partner_id) {
            await supabase
              .from("profiles")
              .update({ partner_id: null, partner_name: null, partner_streak: 0 })
              .eq("id", myProfile.partner_id);
          }

          // Deactivate any active links
          await supabase
            .from("partner_links")
            .update({ status: "expired" })
            .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
            .eq("status", "active");
        }
      } catch (e: any) {
        console.warn("Failed to unlink partner in cloud:", e.message);
      }
    }

    return true;
  },
};
