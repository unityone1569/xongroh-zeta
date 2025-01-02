import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-dark-2">
        <DialogHeader>
          <DialogTitle className="text-light-1 text-xl">
            Welcome to Xongroh! 👋
          </DialogTitle>
          <DialogDescription className="text-light-2">
            Discover a platform where creators earn, share, connect and grow
            together.
          </DialogDescription>
        </DialogHeader>
        <div
          className="text-light-2 py-4"
          role="region"
          aria-label="Platform features"
        >
          <h4 className="small-semibold mb-1.5">
            {' '}
            <span className="text-violet-400">⭐</span> Here's what you can do:
          </h4>
          <ul className="space-y-2 subtle-comment list-disc pl-4" role="list">
            <li role="listitem">
              • Share your{' '}
              <span className="font-semibold text-violet-300">Creations</span>{' '}
              and{' '}
              <span className="font-semibold text-violet-300">Projects</span>
            </li>
            <li role="listitem">
              • Connect and Grow with other{' '}
              <span className="font-semibold text-violet-300">Creators</span>
            </li>
            <li role="listitem">
              • Make a Professional{' '}
              <span className="font-semibold text-violet-300">Portfolio</span>
            </li>
            <li role="listitem">
              • Give constructive{' '}
              <span className="font-semibold text-violet-300">Feedbacks</span>{' '}
              with Creators.
            </li>
          </ul>

          <h4 className="small-semibold mb-2 mt-9 flex items-center gap-2">
            <span className="text-violet-400">🚀</span>
            Coming Soon
          </h4>
          <ul className="space-y-2 subtle-comment pl-4" role="list">
            <li role="listitem" className="text-light-2">
              •{' '}
              <span className="font-semibold text-violet-300">Marketplace</span>{' '}
              - Earn by selling rights, commissions and services
            </li>
            <li role="listitem" className="text-light-2">
              • <span className="font-semibold text-violet-300">Community</span>{' '}
              - Share Ideas and Collaborate.
            </li>
            <li role="listitem" className="text-light-2">
              •{' '}
              <span className="font-semibold text-violet-300">MasterClass</span>{' '}
              - Learn from the Experts.
            </li>
            <li role="listitem" className="text-light-2">
              •{' '}
              <span className="font-semibold text-violet-300">Events</span> -
              Discover Events and get Tickets for your fav Creators.
            </li>
            {/* <li role="listitem" className="text-light-2">
              ♦ <span className="font-semibold text-violet-300">Patrons</span> -
              Build a supportive fan base.
            </li> */}
          </ul>
        </div>
        <DialogFooter>
          <Button
            className="shad-button_primary"
            onClick={() => onOpenChange(false)}
            aria-label="Begin using Xongroh"
          >
            Let's Begin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
