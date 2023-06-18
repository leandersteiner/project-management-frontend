import './scrollbar.css';
import { Draggable } from 'react-beautiful-dnd';
import { Button, Col, Row, Space, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { DroppableTypes } from '../../constants/DroppableTypes';
import { StrictModeDroppable } from '../dnd/StrictModeDroppable';
import { BoardColumnTask } from './BoardColumnTask';
import { AddNewItem } from './AddNewItem';
import { Task } from '../../models/task/Task';

export type BoardColumnProps = {
  id: string;
  title: string;
  index: number;
  tasks: Task[];
  onTaskCreated: (title: string, columnId: string) => void;
  onTaskDeleted: (taskId: string, columnId: string) => void;
  onColumnDeleted: (columnId: string) => void;
};

export const BoardColumn = ({
  id,
  title,
  index,
  tasks,
  onTaskCreated,
  onTaskDeleted,
  onColumnDeleted
}: BoardColumnProps) => {
  const tasksNode = tasks
    .sort((a, b) => a.position - b.position)
    .map(task => (
      <Draggable key={task.id} draggableId={`task:${task.id}`} index={task.position}>
        {({ innerRef, draggableProps, dragHandleProps }) => (
          <div {...draggableProps} {...dragHandleProps} ref={innerRef}>
            <div key={task.id} style={{ paddingBottom: '5px' }}>
              <BoardColumnTask
                id={task.id}
                columnId={id}
                title={task.name}
                onTaskDeleted={onTaskDeleted}
              />
            </div>
          </div>
        )}
      </Draggable>
    ));

  return (
    <StrictModeDroppable
      droppableId={`column:${id}`}
      type={DroppableTypes.CARD}
      direction='vertical'
    >
      {({ innerRef, droppableProps, placeholder }) => (
        <Space
          {...droppableProps}
          ref={innerRef}
          direction='vertical'
          style={{ width: '100%', height: '100%' }}
        >
          <Row justify='space-between' align='middle'>
            <Col>
              <h1>{title}</h1>
            </Col>
            <Col>
              <Tooltip title='Delete Column'>
                <Button
                  type='primary'
                  icon={<DeleteOutlined />}
                  danger
                  size='small'
                  onClick={() => onColumnDeleted(id)}
                />
              </Tooltip>
            </Col>
          </Row>
          <div style={{ overflowY: 'hidden' }} className='scrollbar'>
            {tasksNode}
            {placeholder}
          </div>
          <AddNewItem
            onAdd={text => onTaskCreated(text, id)}
            toggleButtonText='+ Add another Task'
          />
        </Space>
      )}
    </StrictModeDroppable>
  );
};
