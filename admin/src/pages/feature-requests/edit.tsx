import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Card } from "antd";
import { Typography } from "antd";

const { TextArea } = Input;
const { Text } = Typography;

const statusOptions = [
  { value: "submitted", label: "Submitted" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "ui", label: "UI/UX" },
  { value: "performance", label: "Performance" },
  { value: "integration", label: "Integration" },
  { value: "workflow", label: "Workflow" },
  { value: "documentation", label: "Documentation" },
  { value: "ai", label: "AI/ML" },
  { value: "security", label: "Security" },
];

const productOptions = [
  { value: "chipos", label: "ChipOS" },
  { value: "bevybeats", label: "BevyBeats" },
  { value: "savitri", label: "Savitri" },
  { value: "zaphy", label: "Zaphy" },
  { value: "agentic", label: "Agentic Control" },
  { value: "yuj", label: "Yuj" },
  { value: "adaptivision", label: "AdaptiveVision" },
  { value: "systemverilog", label: "SystemVerilogGPT" },
];

export const FeatureRequestEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();

  const record = queryResult?.data?.data;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Card title="Request Details" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={4} />
          </Form.Item>
        </Card>

        <Card title="Classification" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Product"
            name="product"
            rules={[{ required: true, message: "Product is required" }]}
          >
            <Select options={productOptions} />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item label="Category" name="category">
            <Select options={categoryOptions} />
          </Form.Item>
        </Card>

        <Card title="Admin Notes" style={{ marginBottom: 16 }}>
          <Form.Item label="Admin Response" name="admin_response">
            <TextArea
              rows={3}
              placeholder="Add a response or note visible to the submitter..."
            />
          </Form.Item>
        </Card>

        <Card title="Submitter Info" style={{ background: "#1a1a24" }}>
          <Text type="secondary">
            <strong>Submitter:</strong> {record?.submitter_name || "Anonymous"}
          </Text>
          <br />
          <Text type="secondary">
            <strong>Email:</strong> {record?.submitter_email || "Not provided"}
          </Text>
          <br />
          <Text type="secondary">
            <strong>Votes:</strong> {record?.votes || 0}
          </Text>
          <br />
          <Text type="secondary">
            <strong>Created:</strong>{" "}
            {record?.created_at
              ? new Date(record.created_at).toLocaleString()
              : "Unknown"}
          </Text>
        </Card>
      </Form>
    </Edit>
  );
};
