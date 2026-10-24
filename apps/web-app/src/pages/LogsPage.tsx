import {
  ClearOutlined,
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Input, Space, Switch, Tag, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "../api/client";
import { downloadServerLogs } from "../api/server";
import { useServerLogs } from "../hooks/useServerLogs";

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LogsPage() {
  const { message } = App.useApp();
  const { lines, connected, error, setPaused, clear } = useServerLogs();
  const [paused, setPausedState] = useState(false);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!filter.trim()) {
      return lines;
    }
    const needle = filter.toLowerCase();
    return lines.filter((line) => line.message.toLowerCase().includes(needle));
  }, [lines, filter]);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const element = consoleRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [autoScroll]);

  const togglePause = () => {
    const next = !paused;
    setPausedState(next);
    setPaused(next);
  };

  const download = async () => {
    try {
      const blob = await downloadServerLogs(5_000);
      saveBlob(blob, `mc-bedrock-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
      message.success("Log file downloaded");
    } catch (downloadError) {
      message.error(errorMessage(downloadError));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live console</h1>
          <p className="page-subtitle">Docker log stream from the Bedrock container</p>
        </div>
        <Space wrap>
          <Tag color={connected ? "green" : "red"}>{connected ? "CONNECTED" : "OFFLINE"}</Tag>
          {error && <Typography.Text type="danger">{error}</Typography.Text>}
          <Input.Search
            allowClear
            placeholder="Filter lines"
            style={{ width: 220 }}
            onChange={(event) => setFilter(event.target.value)}
          />
          <Button
            icon={paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={togglePause}
          >
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button icon={<ClearOutlined />} onClick={clear}>
            Clear
          </Button>
          <Button icon={<DownloadOutlined />} onClick={download}>
            Download
          </Button>
          <Space>
            <Typography.Text type="secondary">Auto-scroll</Typography.Text>
            <Switch checked={autoScroll} onChange={setAutoScroll} />
          </Space>
        </Space>
      </div>

      <Card styles={{ body: { padding: 12 } }}>
        <div className="log-console" ref={consoleRef}>
          {filtered.length === 0 ? (
            <div className="muted">
              {connected ? "Waiting for log output…" : "Connecting to the log stream…"}
            </div>
          ) : (
            filtered.map((line) => (
              <div
                key={line.timestamp}
                className={`log-line ${line.stream === "stderr" ? "log-stderr" : ""}`}
              >
                <span className="log-time">{line.timestamp.slice(11, 19)}</span>
                {line.message}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
