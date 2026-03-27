import { ConfirmModal } from './ConfirmModal';

interface EndRoundModalProps {
  holesCompleted: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndRoundModal({ holesCompleted, onConfirm, onCancel }: EndRoundModalProps) {
  return (
    <ConfirmModal
      title="Leave Round"
      message={`You've entered scores for ${holesCompleted} hole${holesCompleted !== 1 ? 's' : ''}. The round will stay active and you can return to it from the dashboard.`}
      confirmText="Leave Round"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
