import { Modal } from 'antd';
import { TaskOverview } from './TaskOverview';
import { Task } from '../../models/task/Task';

type TaskOverviewModalProps = {
  isOpen: boolean;
  close: () => void;
  task: Task;
};

export const TaskOverviewModal = ({ isOpen, close, task }: TaskOverviewModalProps) => {
  return (
    <Modal title='Basic Modal' open={isOpen} onOk={() => close} onCancel={close}>
      <TaskOverview task={task} close={() => close} />
    </Modal>
  );
};
