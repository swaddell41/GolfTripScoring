import { ConfirmModal } from './ConfirmModal';

interface EndRoundModalProps {
  holesCompleted: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndRoundModal({ holesCompleted, onConfirm, onCancel }: EndRoundModalProps) {
  return (
    <ConfirmModal
      title="End Round Early"
      message={`You have completed ${holesCompleted} hole${holesCompleted !== 1 ? 's' : ''}. All game results will be calculated based on completed holes only.`}
      secondMessage="This cannot be undone. Are you absolutely sure you want to end the round early?"
      confirmText="End Round"
      doubleConfirm
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
