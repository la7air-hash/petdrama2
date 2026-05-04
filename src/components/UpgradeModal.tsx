import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StickerButton } from "@/components/StickerButton";

export type UpgradeReason =
  | "anon_limit"
  | "daily_limit_reached"
  | "monthly_limit_reached"
  | "pro_only";

const COPY: Record<UpgradeReason, { title: string; body: string; primary: string; primaryTo: string }> = {
  anon_limit: {
    title: "Create a free account to keep going",
    body: "Create a free account to generate more PetDramas. Free accounts get 5 creations per day.",
    primary: "Sign in — free",
    primaryTo: "/login",
  },
  daily_limit_reached: {
    title: "Daily limit reached",
    body: "You've used your 5 free creations for today. Upgrade to Pro or come back tomorrow.",
    primary: "Upgrade to Pro",
    primaryTo: "/pricing",
  },
  monthly_limit_reached: {
    title: "Monthly limit reached",
    body: "You've used all 150 Pro creations this month. Your quota resets on a rolling 30-day window.",
    primary: "View plans",
    primaryTo: "/pricing",
  },
  pro_only: {
    title: "Drama Remix is a Pro feature",
    body: "Upgrade to Pro to stylize photos with Drama Remix, unlock all styles, remove watermarks and download in HD.",
    primary: "Upgrade to Pro",
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
