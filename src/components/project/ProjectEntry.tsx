import { CSSProperties, useState } from 'react';
import { DeleteOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Tooltip, Typography } from 'antd';
import Title from 'antd/es/typography/Title';
import { deleteProject } from '../../api/projectsApi';
import { Project } from '../../models/project/Project';
import { useAuth } from '../../context/AuthContext';

type ProjectEntryProps = {
  project: Project;
};

const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '10px'
};

export const ProjectEntry: React.FC<ProjectEntryProps> = (props: ProjectEntryProps) => {
  const { user } = useAuth();

  const [isHover, setIsHover] = useState(false);

  const projectEntryStyle: CSSProperties = {
    transition: 'box-shadow .3s',
    backgroundColor: '#ffffff',
    borderRadius: '5px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    gap: '10px',
    boxShadow: isHover
      ? 'rgba(0, 0, 0, 0.35) 0px 5px 15px'
      : 'rgba(149, 157, 165, 0.2) 0px 8px 24px'
  };

  const userAvatarStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignContent: 'center',
    gap: '10px'
  };

  const projectHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%'
  };

  return (
    <div
      style={projectEntryStyle}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <span style={projectHeaderStyle}>
        <Typography.Title
          style={{ margin: '0', maxWidth: '50%' }}
          level={4}
          ellipsis={{ rows: 1, tooltip: true }}
        >
          {props.project.name}
        </Typography.Title>

        <span style={userAvatarStyle}>
          <Title style={{ margin: '0' }} level={5}>
            {props.project.owner.username}
          </Title>
          <Avatar size='small' icon={<UserOutlined />} />
        </span>
      </span>

      <Title style={{ margin: '0' }} level={5}>
        {props.project.team.name}
      </Title>

      <span style={buttonContainerStyle}>
        <Tooltip title='Add user'>
          <Button
            icon={<UserAddOutlined />}
            disabled={!(props.project.owner.username === user?.username)}
          />
        </Tooltip>

        <Tooltip title='Delete'>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              deleteProject(
                props.project.team.organisation.id,
                props.project.team.id,
                props.project.id
              )
            }
            disabled={!(props.project.owner.username === user?.username)}
          />
        </Tooltip>
      </span>
    </div>
  );
};
