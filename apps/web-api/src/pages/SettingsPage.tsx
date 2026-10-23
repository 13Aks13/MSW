import { ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import type { ServerPropertyDto } from '@mc/shared';
import { applySettings, listServerProperties, updateServerProperties } from '../api/settings';
import { errorMessage } from '../api/client';
import { canWrite, useAuthStore } from '../store/auth';

export default function SettingsPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canEdit = canWrite(role);
  const [form] = Form.useForm<Record<string, string | number>>();

  const properties = useQuery({
    queryKey: ['server-properties'],
    queryFn: listServerProperties,
  });

  const save = useMutation({
    mutationFn: (values: Record<string, string>) => updateServerProperties(values),
    onSuccess: async () => {
      message.success('Settings saved — restart the server to apply them');
      await queryClient.invalidateQueries({ queryKey: ['server-properties'] });
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const apply = useMutation({
    mutationFn: applySettings,
    onSuccess: () => {
      message.success('Server restarted with the new settings');
      void queryClient.invalidateQueries();
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const initialValues = Object.fromEntries(
    (properties.data ?? []).map((property) => [property.key, property.value]),
  );

  const onFinish = (values: Record<string, string | number>) => {
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
      payload[key] = String(value);
    }
    save.mutate(payload);
  };

  const renderField = (property: ServerPropertyDto) => {
    if (property.type === 'boolean') {
      return (
        <Select
          disabled={!canEdit || property.readOnly}
          options={[
            { value: 'true', label: 'Enabled' },
            { value: 'false', label: 'Disabled' },
          ]}
        />
      );
    }
    if (property.type === 'enum') {
      return (
        <Select
          disabled={!canEdit || property.readOnly}
          options={(property.options ?? []).map((option) => ({ value: option, label: option }))}
        />
      );
    }
    if (property.type === 'number') {
      return <InputNumber disabled={!canEdit || property.readOnly} style={{ width: '100%' }} min={0} />;
    }
    return <Input disabled={!canEdit || property.readOnly} />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Allow-listed server.properties values</p>
        </div>
        <Space>
          <Button
            icon={<SaveOutlined />}
            type="primary"
            disabled={!canEdit}
            loading={save.isPending}
            onClick={() => form.submit()}
          >
            Save
          </Button>
          <Button
            icon={<ExclamationCircleOutlined />}
            disabled={!canEdit}
            loading={apply.isPending}
            onClick={() =>
              modal.confirm({
                title: 'Restart the server now?',
                content: 'Connected players will be disconnected. Pending settings are applied.',
                okText: 'Restart',
                onOk: () => apply.mutateAsync(),
              })
            }
          >
            Save & restart
          </Button>
        </Space>
      </div>

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Environment variables can override these values"
        description="Keep GAMEMODE, DIFFICULTY, MAX_PLAYERS and similar variables out of docker-compose.yml if you want to manage them here. level-name is fixed by the platform."
      />

      <Card>
        {properties.isLoading ? (
          <Spin />
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            key={properties.dataUpdatedAt}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0 20px',
              }}
            >
              {(properties.data ?? []).map((property) => (
                <Form.Item
                  key={property.key}
                  name={property.key}
                  label={property.label}
                  extra={property.readOnly ? 'Read-only' : undefined}
                >
                  {renderField(property)}
                </Form.Item>
              ))}
            </div>
            {!canEdit && (
              <Typography.Text type="secondary">
                Your role is read-only for server settings.
              </Typography.Text>
            )}
          </Form>
        )}
      </Card>
    </div>
  );
}
