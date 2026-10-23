import {
  CloudServerOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { formatBytes } from "@mc/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Card, Progress, Space, Statistic, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { getDashboard, serverAction } from "../api/server";
import { canWrite, useAuthStore } from "../store/auth";

export default function DashboardPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canControl = canWrite(role);

  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 10_000,
  });

  const action = useMutation({
    mutationFn: serverAction,
    onSuccess: async (_data, variables) => {
      message.success(`Server ${variables} requested`);
      await queryClient.invalidateQueries();
    },
    onError: (error) => message.error(error.message),
  });

  const data = dashboard.data;
  const running = data?.server.state === "running";

  const confirmAction = (kind: "stop" | "restart") => {
    modal.confirm({
      title: kind === "stop" ? "Stop the Bedrock server?" : "Restart the Bedrock server?",
      content: "Connected players will be disconnected. Bedrock flushes the world before stopping.",
      okText: kind === "stop" ? "Stop server" : "Restart server",
      okButtonProps: { danger: kind === "stop" },
      onOk: () => action.mutateAsync(kind),
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live server health, library counts and storage</p>
        </div>
        <Space wrap className="server-controls">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dashboard.refetch()}
            loading={dashboard.isFetching}
          >
            Refresh
          </Button>
          {canControl && (
            <>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                disabled={running}
                loading={action.isPending}
                onClick={() => action.mutate("start")}
              >
                Start
              </Button>
              <Button
                icon={<PoweroffOutlined />}
                disabled={!running}
                loading={action.isPending}
                onClick={() => confirmAction("stop")}
              >
                Stop
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                disabled={!running}
                loading={action.isPending}
                onClick={() => confirmAction("restart")}
              >
                Restart
              </Button>
            </>
          )}
        </Space>
      </div>

      <div className="stat-grid">
        <Card>
          <Statistic
            title="Server"
            value={data?.server.state ?? "unknown"}
            valueStyle={{ color: running ? "#1f6f43" : "#a8071a", textTransform: "capitalize" }}
            suffix={data?.server.health ? <Tag color="green">{data.server.health}</Tag> : undefined}
          />
          <Typography.Text type="secondary" className="muted">
            {data?.server.containerName ?? "mc-bedrock"}
            {data?.server.uptimeSeconds
              ? ` · up ${Math.floor(data.server.uptimeSeconds / 60)} min`
              : ""}
          </Typography.Text>
        </Card>

        <Card>
          <Statistic title="Worlds" value={data?.worlds ?? 0} prefix={<DatabaseOutlined />} />
          <Link to="/worlds">Manage worlds</Link>
        </Card>

        <Card>
          <Statistic
            title="Packs"
            value={(data?.packs.resource ?? 0) + (data?.packs.behavior ?? 0)}
            prefix={<ThunderboltOutlined />}
            suffix={
              <span className="muted">
                {data?.packs.resource ?? 0} R / {data?.packs.behavior ?? 0} B
              </span>
            }
          />
          <Link to="/packs">Open library</Link>
        </Card>

        <Card>
          <Statistic title="Backups" value={data?.backups ?? 0} prefix={<CloudServerOutlined />} />
          <Link to="/backups">View backups</Link>
        </Card>

        <Card>
          <Statistic title="Storage free" value={data ? formatBytes(data.storageFreeBytes) : "—"} />
          <Typography.Text type="secondary" className="muted">
            used {data ? formatBytes(data.storageUsedBytes) : "—"}
          </Typography.Text>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="Resources">
        <Space size={40} wrap>
          <div style={{ minWidth: 220 }}>
            <Typography.Text type="secondary">CPU</Typography.Text>
            <Progress
              percent={data?.stats?.cpuPercent ?? 0}
              status={running ? "active" : "normal"}
              format={(percent) => `${percent ?? 0}%`}
            />
          </div>
          <div style={{ minWidth: 260 }}>
            <Typography.Text type="secondary">
              Memory{" "}
              {data?.stats
                ? `${formatBytes(data.stats.memoryUsageBytes)} / ${formatBytes(data.stats.memoryLimitBytes)}`
                : ""}
            </Typography.Text>
            <Progress
              percent={data?.stats?.memoryPercent ?? 0}
              status={running ? "active" : "normal"}
            />
          </div>
          <div>
            <Typography.Text type="secondary">Network</Typography.Text>
            <div>
              ↓ {data?.stats ? formatBytes(data.stats.networkRxBytes) : "—"} · ↑{" "}
              {data?.stats ? formatBytes(data.stats.networkTxBytes) : "—"}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
}
