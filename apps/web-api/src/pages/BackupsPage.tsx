import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { type BackupDto, formatBytes } from '@mc/shared';
import {
  createBackup,
  deleteBackup,
  downloadBackup,
  listBackups,
  restoreBackup,
} from '../api/backups';
import { listWorlds } from '../api/worlds';
import { errorMessage } from '../api/client';
import { canWrite, useAuthStore } from '../store/auth';

const STATUS_COLORS: Record<BackupDto['status'], string> = {
  ready: 'green',
  creating: 'blue',
  failed: 'red',
};

export default function BackupsPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManage = canWrite(role);

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<{ worldId?: string }>();
  const [restoreTarget, setRestoreTarget] = useState<BackupDto | null>(null);
  const [restoreForm] = Form.useForm<{ worldId: string }>();

  const backups = useQuery({
    queryKey: ['backups', page],
    queryFn: () => listBackups(page, 20),
    refetchInterval: 15_000,
  });

  const worlds = useQuery({
    queryKey: ['worlds', 'backup-select'],
    queryFn: () => listWorlds({ limit: 200 }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['backups'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['worlds'] });
  };

  const create = useMutation({
    mutationFn: (worldId?: string) => createBackup(worldId),
    onSuccess: async (result) => {
      message.success(`Backup ${result.fileName} created`);
      setCreateOpen(false);
      createForm.resetFields();
      await invalidate();
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const restore = useMutation({
    mutationFn: ({ id, worldId }: { id: string; worldId: string }) => restoreBackup(id, worldId),
    onSuccess: async () => {
      message.success('Backup restored and server restarted');
      setRestoreTarget(null);
      restoreForm.resetFields();
      await invalidate();
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: deleteBackup,
    onSuccess: async () => {
      message.success('Backup deleted');
      await invalidate();
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const download = useMutation({
    mutationFn: (backup: BackupDto) => downloadBackup(backup.id, backup.fileName),
    onError: (error) => message.error(errorMessage(error)),
  });

  const columns: TableProps<BackupDto>['columns'] = [
    {
      title: 'Archive',
      key: 'file',
      render: (_value, backup) => (
        <div>
          <Typography.Text strong>{backup.worldName}</Typography.Text>
          <div className="muted mono">{backup.fileName}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: BackupDto['status']) => (
        <Tag color={STATUS_COLORS[status]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'sizeBytes',
      key: 'size',
      width: 110,
      render: (value: string) => formatBytes(value),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '',
      key: 'actions',
      width: 170,
      render: (_value, backup) =>
        canManage ? (
          <Space size={0}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              aria-label="Download backup"
              loading={download.isPending}
              onClick={() => download.mutate(backup)}
            />
            <Button
              type="text"
              icon={<RollbackOutlined />}
              aria-label="Restore backup"
              disabled={backup.status !== 'ready'}
              onClick={() => setRestoreTarget(backup)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Delete backup"
              onClick={() =>
                modal.confirm({
                  title: 'Delete this backup?',
                  content: backup.fileName,
                  okText: 'Delete',
                  okButtonProps: { danger: true },
                  onOk: () => remove.mutateAsync(backup.id),
                })
              }
            />
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Backups</h1>
          <p className="page-subtitle">
            Compressed world archives. The server is stopped for the duration of the operation.
          </p>
        </div>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create backup
          </Button>
        )}
      </div>

      <Card>
        <Table<BackupDto>
          rowKey="id"
          size="middle"
          loading={backups.isLoading}
          columns={columns}
          dataSource={backups.data?.items ?? []}
          pagination={{
            current: page,
            pageSize: 20,
            total: backups.data?.total ?? 0,
            showSizeChanger: false,
            onChange: setPage,
          }}
          locale={{ emptyText: 'No backups yet' }}
        />
      </Card>

      <Modal
        open={createOpen}
        title="Create backup"
        okText="Create"
        confirmLoading={create.isPending}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
      >
        <Form<{ worldId?: string }>
          form={createForm}
          layout="vertical"
          onFinish={(values) => create.mutate(values.worldId)}
        >
          <Form.Item name="worldId" label="World" extra="Leave empty to archive the whole worlds directory">
            <Select
              allowClear
              placeholder="All worlds"
              options={(worlds.data?.items ?? []).map((world) => ({
                value: world.id,
                label: `${world.name}${world.status === 'active' ? ' (active)' : ''}`,
              }))}
            />
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          <CloudDownloadOutlined /> Output: storage/backups/&lt;world&gt;-YYYY-MM-DD-HH-mm-ss.tar.gz
        </Typography.Paragraph>
      </Modal>

      <Modal
        open={restoreTarget !== null}
        title="Restore backup"
        okText="Restore"
        okButtonProps={{ danger: true }}
        confirmLoading={restore.isPending}
        onCancel={() => setRestoreTarget(null)}
        onOk={() => restoreForm.submit()}
      >
        <Typography.Paragraph>
          Restore <strong>{restoreTarget?.fileName}</strong> into a world. The current world files are
          replaced after the server stops.
        </Typography.Paragraph>
        <Form<{ worldId: string }>
          form={restoreForm}
          layout="vertical"
          onFinish={(values) =>
            restoreTarget && restore.mutate({ id: restoreTarget.id, worldId: values.worldId })
          }
        >
          <Form.Item
            name="worldId"
            label="Target world"
            rules={[{ required: true, message: 'Select a target world' }]}
          >
            <Select
              placeholder="Select a world"
              options={(worlds.data?.items ?? []).map((world) => ({
                value: world.id,
                label: world.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
