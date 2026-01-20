import {
  List,
  useTable,
  EditButton,
  ShowButton,
  TextField,
  DateField,
  FilterDropdown,
} from "@refinedev/antd";
import { Table, Space, Select, Tag, Input, Badge, Card, Row, Col, Statistic } from "antd";
import { useList } from "@refinedev/core";

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

export const FeatureRequestList: React.FC = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
  });

  // Get statistics
  const { data: statsData } = useList({
    resource: "feature_requests",
    pagination: { mode: "off" },
  });

  const stats = {
    total: statsData?.total || 0,
    submitted: statsData?.data?.filter((r) => r.status === "submitted").length || 0,
    planned: statsData?.data?.filter((r) => r.status === "planned").length || 0,
    in_progress: statsData?.data?.filter((r) => r.status === "in_progress").length || 0,
    completed: statsData?.data?.filter((r) => r.status === "completed").length || 0,
  };

  return (
    <List>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Requests" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Planned"
              value={stats.planned}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.in_progress}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="product"
          title="Product"
          render={(value) => (
            <Tag color="blue">{productLabels[value] || value}</Tag>
          )}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 200 }}
                placeholder="Select Product"
                options={Object.entries(productLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="title"
          title="Title"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search title" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="category"
          title="Category"
          render={(value) => (
            <Tag style={{ color: categoryColors[value] || "#00ffff" }}>
              {value || "general"}
            </Tag>
          )}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 150 }}
                placeholder="Select Category"
                options={Object.keys(categoryColors).map((cat) => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1),
                }))}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value) => (
            <Badge
              status={statusColors[value] as any}
              text={statusLabels[value] || value}
            />
          )}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 150 }}
                placeholder="Select Status"
                options={Object.entries(statusLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="votes"
          title="Votes"
          sorter
          render={(value) => <TextField value={value || 0} />}
        />
        <Table.Column
          dataIndex="submitter_name"
          title="Submitter"
          render={(value) => <TextField value={value || "Anonymous"} />}
        />
        <Table.Column
          dataIndex="created_at"
          title="Created"
          sorter
          render={(value) => <DateField value={value} format="MMM D, YYYY" />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
