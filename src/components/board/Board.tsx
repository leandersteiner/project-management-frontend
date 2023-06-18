import { Col, Row } from 'antd';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BoardColumn } from './BoardColumn';
import { DroppableTypes } from '../../constants/DroppableTypes';
import { StrictModeDroppable } from '../dnd/StrictModeDroppable';
import { AddNewItem } from './AddNewItem';
import {
  createTask,
  CreateTaskRequest,
  createTaskState,
  CreateTaskStateRequest,
  deleteTask,
  TaskResponse,
  TaskStateResponse,
  updateTask
} from '../../api/taskApi';
import { Task } from '../../models/task/Task';
import { Board as BoardModel } from '../../models/board/Board';
import { moveInList, moveTaskBetweenColumns } from '../../helpers/drag';
import {
  BoardColumnResponse,
  createBoardColumn,
  CreateBoardColumnRequest,
  deleteBoardColumn,
  updateBoardColumn,
  UpdateBoardColumnRequest
} from '../../api/boardApi';
import { User } from '../../models/user/User';

const BACKLOG_ID = 'backlog';

const parseDndId = (dndId: string) => dndId.split(':')[1];

type BoardProps = {
  projectId: string;
  board: BoardModel;
  backlog: Task[];
  user: User;
};

export const Board = ({ projectId, board: model, backlog: b, user }: BoardProps) => {
  const queryClient = useQueryClient();
  const [board, setBoard] = useState<BoardModel>(model);
  const [backlog, setBacklog] = useState<Task[]>(b);
  const [dragging, setDragging] = useState(false);

  const updateTaskMutation = useMutation<TaskResponse, Error, Task>({
    mutationFn: updateTask(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });
  const updateColumnMutation = useMutation<BoardColumnResponse, Error, UpdateBoardColumnRequest>({
    mutationFn: updateBoardColumn(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });
  const createColumnMutation = useMutation<BoardColumnResponse, Error, CreateBoardColumnRequest>({
    mutationFn: createBoardColumn(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });
  const createTaskStateMutation = useMutation<TaskStateResponse, Error, CreateTaskStateRequest>({
    mutationFn: createTaskState(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });
  const createTaskMutation = useMutation<TaskResponse, Error, CreateTaskRequest>({
    mutationFn: createTask(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });
  const deleteTaskMutation = useMutation<void, Error, string>({
    mutationFn: deleteTask(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board', 'backlog'])
  });
  const deleteColumnMutation = useMutation<void, Error, string>({
    mutationFn: deleteBoardColumn(projectId),
    onSuccess: () => queryClient.invalidateQueries(['board'])
  });

  const handleCardMoved = (taskId: string, columnId: string, index: number) => {
    const toBacklog = columnId === BACKLOG_ID;
    const fromBacklog = !!backlog.find(task => task.id === taskId);

    if (toBacklog) {
      if (fromBacklog) {
        const movedTask = backlog.find(t => t.id === taskId);
        if (!movedTask) return;
        moveInList(backlog, movedTask.position, index);
        setBacklog([...backlog]);
        backlog.forEach(task => updateTaskMutation.mutate(task));
      } else {
        const oldColumn = board.columns.find(col => {
          return !!col.tasks.find(task => task.id === taskId);
        });
        if (!oldColumn) return;
        const movedTask = oldColumn.tasks.find(task => task.id === taskId);
        if (!movedTask) return;
        const { newSource, newDestination } = moveTaskBetweenColumns(
          oldColumn.tasks,
          oldColumn.id,
          backlog,
          BACKLOG_ID,
          movedTask,
          index
        );
        oldColumn.tasks = newSource;
        movedTask.boardColumnId = null;
        movedTask.taskStateId = null;
        setBacklog([...newDestination]);
        setBoard({ ...board });
        oldColumn.tasks.forEach(task => updateTaskMutation.mutate(task));
        backlog.forEach(task => updateTaskMutation.mutate(task));
      }
    } else if (fromBacklog) {
      const movedTask = backlog.find(task => task.id === taskId);
      if (!movedTask) return;
      movedTask.boardColumnId = columnId;
      const newColumn = board.columns.find(column => column.id === columnId);
      if (!newColumn) return;
      const { newSource, newDestination } = moveTaskBetweenColumns(
        backlog,
        BACKLOG_ID,
        newColumn.tasks,
        newColumn.id,
        movedTask,
        index
      );
      newColumn.tasks = newDestination;
      setBacklog([...newSource]);
      setBoard({ ...board });
      backlog.forEach(task => updateTaskMutation.mutate(task));
      newColumn.tasks.forEach(task => updateTaskMutation.mutate(task));
    } else {
      const oldColumn = board.columns.find(column => {
        return !!column.tasks.find(task => task.id === taskId);
      });
      if (!oldColumn) return;
      const movedTask = oldColumn.tasks.find(task => task.id === taskId);
      if (!movedTask) return;
      movedTask.boardColumnId = columnId;
      const newColumn = board.columns.find(column => column.id === columnId);
      if (!newColumn) return;
      if (oldColumn.id === newColumn.id) {
        moveInList(oldColumn.tasks, movedTask.position, index);
        setBoard({ ...board });
        board.columns.forEach(column =>
          updateColumnMutation.mutate({ columnId: column.id, data: column })
        );
      } else {
        movedTask.boardColumnId = columnId;
        const { newSource, newDestination } = moveTaskBetweenColumns(
          oldColumn.tasks,
          oldColumn.id,
          newColumn.tasks,
          newColumn.id,
          movedTask,
          index
        );
        oldColumn.tasks = newSource;
        newColumn.tasks = newDestination;
        setBoard({ ...board });
        oldColumn.tasks.forEach(task => updateTaskMutation.mutate(task));
        newColumn.tasks.forEach(task => updateTaskMutation.mutate(task));
      }
    }
  };
  const handleColumnMoved = (id: string, index: number) => {
    const column = board.columns.find(column => column.id === id);
    if (!column) return;
    moveInList(board.columns, column.position, index);
    setBoard({ ...board });
    board.columns.forEach(column =>
      updateColumnMutation.mutate({ columnId: column.id, data: column })
    );
  };
  const handleDragStart = () => {
    setDragging(true);
  };
  const handleColumnCreated = (title: string) => {
    createTaskStateMutation.mutate(
      {
        name: title,
        projectId
      },
      {
        onSuccess: taskState => {
          createColumnMutation.mutate(
            {
              title,
              position: board.columns.length + 1,
              taskStateId: taskState.id,
              state: taskState
            },
            {
              onSuccess: column => {
                column.tasks = column.tasks ?? [];
                board.columns.push(column);
                setBoard({ ...board });
              }
            }
          );
        }
      }
    );
  };
  const handleTaskCreated = (title: string, columnId: string) => {
    const inBacklog = columnId === BACKLOG_ID;
    if (inBacklog) {
      const newTask: Partial<Task> = {
        boardColumnId: null,
        name: title,
        description: '',
        projectId,
        creatorId: user.id,
        done: false,
        position: backlog.length + 1
      };
      createTaskMutation.mutate(
        { columnId: null, data: newTask },
        {
          onSuccess: task => {
            setBacklog([...backlog, task]);
          }
        }
      );
    } else {
      const column = board.columns.find(column => column.id === columnId);
      if (!column) return;
      const newTask: Partial<Task> = {
        boardColumnId: columnId,
        name: title,
        description: '',
        projectId,
        creatorId: user.id,
        done: false,
        position: backlog.length + 1,
        taskStateId: column.taskStateId
      };
      createTaskMutation.mutate(
        { columnId, data: newTask },
        {
          onSuccess: task => {
            column.tasks.push(task);
            setBoard({ ...board });
          }
        }
      );
    }
  };
  const handleTaskDeleted = (taskId: string, columnId: string) => {
    const inBacklog = columnId === BACKLOG_ID;

    if (inBacklog) {
      const deletedTask = backlog.find(task => task.id === taskId);
      if (!deletedTask) return;
      setBacklog([...backlog.filter(task => task.id !== taskId)]);
      deleteTaskMutation.mutate(taskId);
    }
  };
  const handleColumnDeleted = (columnId: string) => {
    const deletedColumn = board.columns.find(column => column.id === columnId);
    if (!deletedColumn) return;
    board.columns = board.columns.filter(column => column.id !== columnId);
    setBoard({ ...board });
    deleteColumnMutation.mutate(columnId);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;
    if (
      !destination ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    ) {
      setDragging(false);
      return;
    }

    const id = parseDndId(result.draggableId);

    switch (type) {
      case DroppableTypes.COLUMN:
        handleColumnMoved(id, destination.index);
        break;
      case DroppableTypes.CARD:
        handleCardMoved(id, parseDndId(destination.droppableId), destination.index);
        break;
      default:
    }
    setDragging(false);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <StrictModeDroppable
        droppableId='board'
        type={DroppableTypes.COLUMN}
        direction='horizontal'
        isDropDisabled={!dragging}
      >
        {({ innerRef, droppableProps, placeholder }) => (
          <Row style={{ height: '100%' }} ref={innerRef} {...droppableProps} data-drag-scroller>
            <Col key='board-backlog' flex='auto' style={{ height: '100%' }}>
              <BoardColumn
                onTaskCreated={handleTaskCreated}
                onTaskDeleted={handleTaskDeleted}
                onColumnDeleted={handleColumnDeleted}
                tasks={backlog}
                index={0}
                id={BACKLOG_ID}
                title='Backlog'
              />
            </Col>
            {board.columns
              .sort((a, b) => a.position - b.position)
              .map(column => (
                <Draggable
                  key={column.id}
                  draggableId={`column:${column.id}`}
                  index={column.position}
                  isDragDisabled={dragging}
                >
                  {(provided, snapshot) => (
                    <Col
                      key={column.id}
                      flex='auto'
                      style={{ height: '100%' }}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <BoardColumn
                        onTaskCreated={handleTaskCreated}
                        onTaskDeleted={handleTaskDeleted}
                        onColumnDeleted={handleColumnDeleted}
                        tasks={column.tasks}
                        index={column.position}
                        id={column.id}
                        title={column.title}
                      />
                    </Col>
                  )}
                </Draggable>
              ))}
            {placeholder}
            <Col flex='auto'>
              <AddNewItem onAdd={handleColumnCreated} toggleButtonText='+ Add another column' />
            </Col>
          </Row>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
};
