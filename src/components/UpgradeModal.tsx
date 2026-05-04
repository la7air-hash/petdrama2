import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StickerButton } from "@/components/StickerButton";

export type UpgradeReason =
  | "anon_limit"
  | "daily_limit_reached"
  | "monthly_limit_reached"
  | "monthly_standard_limit_reached"
  | "monthly_remix_limit_reached"
  | "pro_only";

const COPY: Record<UpgradeReason, { title: string; body: string; primary: string; primaryTo: string }> = {
  anon_limit: {
    title: "Create a free account to keep going",
    body: "Free accounts get 15 creations and 5 Drama Remix per month. Sign in to continue.",
    primary: "Sign in — free",
    primaryTo: "/login",
  },
  daily_limit_reached: {
    title: "Limit reached",
    body: "You've used your monthly creations. Upgrade to Standard or Pro for more.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
  monthly_limit_reached: {
    title: "Monthly limit reached",
    body: "Your quota resets on a rolling 30-day window. Upgrade for a higher monthly cap.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
  monthly_standard_limit_reached: {
    title: "Monthly creation limit reached",
    body: "You've used all your standard creations for this 30-day window. Upgrade for more.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
  monthly_remix_limit_reached: {
    title: "Monthly Drama Remix limit reached",
    body: "You've used all your Drama Remix for this 30-day window. Upgrade to Standard or Pro for more.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
  pro_only: {
    title: "Upgrade for more Drama Remix",
    body: "Standard includes 10 remixes per month, Pro includes 20.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
};

interface Props {
  open: boolean;
  reason: UpgradeReason | null;
  onClose: () => void;
}

export function UpgradeModal({ open, reason, onClose }: Props) {
  const navigate = useNavigate();
  const copy = reason ? COPY[reason] : null;
  return (
    <Dialog open={open && !!copy} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{copy?.title}</DialogTitle>
          <DialogDescription className="text-base">{copy?.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <StickerButton variant="ghost" onClick={onClose}>Not now</StickerButton>
          <StickerButton
            variant="primary"
            onClick={() => { onClose(); if (copy) navigate(copy.primaryTo); }}
          >
            {copy?.primary}
          </StickerButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
