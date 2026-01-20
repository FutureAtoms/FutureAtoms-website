import { Show, DateField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Card, Row, Col, Statistic, Badge, Divider, Tag } from "antd";

const { Title, Text, Paragraph } = Typography;

const statusColors: Record<string, string> = {
  submitted: "default",
  planned: "gold",
  in_progress: "processing",
  completed: "success",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
};

const productLabels: Record<string, string> = {
  chipos: "ChipOS",
  bevybeats: "BevyBeats",
  savitri: "Savitri",
  zaphy: "Zaphy",
  agentic: "Agentic Control",
  yuj: "Yuj",
  adaptivision: "AdaptiveVision",
  systemverilog: "SystemVerilogGPT",
};

const categoryColors: Record<string, string> = {
  general: "#00ffff",
  ui: "#ff6b9d",
  performance: "#ffd700",
  integration: "#4facfe",
  workflow: "#00ff88",
  documentation: "#c084fc",
  ai: "#ff8c00",
  security: "#ef4444",
};

export const FeatureRequestShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Request Details">
            <Title level={4}>{record?.title}</Title>
            <Paragraph style={{ marginTop: 16 }}>
              {record?.description || "No description provided."}
            </Paragraph>
          </Card>

          {record?.admin_response && (
            <Card title="Admin Response" style={{ marginTop: 16 }}>
              <Paragraph>{record.admin_response}</Paragraph>
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="Status & Classification">
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Status</Text>
              <div>
                <Badge
                  status={statusColors[record?.status] as any}
                  text={
                    <Text strong>
                      {statusLabels[record?.status] || record?.status}
                    </Text>
                  }
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Product</Text>
              <div>
                <Tag color="blue">
                  {productLabels[record?.product] || record?.product}
                </Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Category</Text>
              <div>
                <Tag
                  style={{
                    color: categoryColors[record?.category] || "#00ffff",
                    borderColor: categoryColors[record?.category] || "#00ffff",
                  }}
                >
                  {record?.category || "general"}
                </Tag>
              </div>
            </div>

            <Divider />

            <Statistic
              title="Total Votes"
              value={record?.votes || 0}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>

          <Card title="Submitter Info" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Name</Text>
              <div>
                <Text>{record?.submitter_name || "Anonymous"}</Text>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Email</Text>
              <div>
                <Text>{record?.submitter_email || "Not provided"}</Text>
              </div>
            </div>

            <Divider />

            <div>
              <Text type="secondary">Created</Text>
              <div>
                {record?.created_at && (
                  <DateField value={record.created_at} format="MMMM D, YYYY h:mm A" />
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
