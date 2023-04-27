import { NodeData, NodeDataLocation, TreeMsg } from "./types/types";
import { DataEdgeTerminal } from "./components/D3BehaviorTreeEditor";

// uuid is used to assign unique IDs to tags so we can use labels properly
let idx = 0;
export const uuid = () => idx++;

// and another one for errors
let error_idx = 0;
export const error_id = () => error_idx++;

export function typesCompatible(a: DataEdgeTerminal, b: DataEdgeTerminal) {
  if (a.nodeName === b.nodeName) {
    return false;
  }

  if (a.kind === b.kind) {
    return false;
  }

  const from = a.kind === "output" ? a : b;
  const to = a.kind === "input" ? a : b;

  // object is compatible with anything
  if (
    to.type === '{"py/type": "__builtin__.object"}' ||
    to.type === '{"py/type": "builtins.object"}'
  ) {
    return true;
  }

  return prettyprint_type(from.type) === prettyprint_type(to.type);
}

export const python_builtin_types = [
  "int",
  "float",
  "long",
  "str",
  "basestring",
  "unicode",
  "bool",
  "list",
  "dict",
  "set",
  "type",
];

export function prettyprint_type(jsonpickled_type: string) {
  const json_type = JSON.parse(jsonpickled_type);
  if (json_type["py/type"] !== undefined) {
    // shorten the CapabilityType
    if (
      json_type["py/type"] === "bt_capabilities.nodes.capability.CapabilityType"
    ) {
      return "CapabilityType";
    }
    // Remove the "builtin" prefix jsonpickle adds
    return json_type["py/type"]
      .replace("__builtin__.", "")
      .replace("builtins.", "")
      .replace(/^basestring$/, "string")
      .replace(/^unicode$/, "string")
      .replace(/^str$/, "string");
  }

  // If the type doesn't have a py/type field, maybe it's an
  // OptionRef?
  if (
    json_type["py/object"] !== undefined &&
    json_type["py/object"] === "ros_bt_py.node_config.OptionRef"
  ) {
    return "OptionRef(" + json_type["option_key"] + ")";
  }

  if (
    json_type["py/reduce"] !== undefined &&
    json_type["py/reduce"][0] !== undefined &&
    json_type["py/reduce"][0]["py/type"] !== undefined &&
    json_type["py/reduce"][0]["py/type"] === "collections.OrderedDict"
  ) {
    return json_type["py/reduce"][0]["py/type"];
  }

  return "Unknown type object: " + jsonpickled_type;
}

export type ValueTypes = string | boolean | number | [] | Record<string, never> | { "py/reduce": ({ "py/type": string; } | { "py/tuple": never[][]; } | null)[]} | {
  "py/object": string,
  logger_level: number,
} | {
  "py/object": string,
  operator: string,
} | {
  "py/object": string,
  operand_type: string,
} | {"py/object": string,
enum_value: string,
field_names: string[],}

export function getDefaultValue(
  typeName: string,
  options: NodeData[] | null = null
): { type: string; value: ValueTypes } {
  if (typeName === "type") {
    return {
      type: "type",
      value: "int",
    };
  } else if (typeName === "int" || typeName === "long") {
    return {
      type: "int",
      value: 0,
    };
  } else if (
    typeName === "str" ||
    typeName === "basestring" ||
    typeName === "unicode" ||
    typeName === "string"
  ) {
    return {
      type: "string",
      value: "foo",
    };
  } else if (typeName === "float") {
    return {
      type: "float",
      value: 1.2,
    };
  } else if (typeName === "bool") {
    return {
      type: "bool",
      value: true,
    };
  } else if (typeName === "list") {
    return {
      type: "list",
      value: [],
    };
  } else if (typeName === "dict") {
    return {
      type: "dict",
      value: {},
    };
  } else if (typeName.startsWith("OptionRef(")) {
    const optionTypeName = typeName.substring(
      "OptionRef(".length,
      typeName.length - 1
    );
    if (options === null) {
      return {
        type: "unset_optionref",
        value: 'Ref to "' + optionTypeName + '"',
      };
    }
    const optionType = options.find((x) => {
      return x.key === optionTypeName;
    });
    if (optionType) {
      return getDefaultValue(prettyprint_type(optionType.serialized_value));
    } else {
      return {
        type: "unset_optionref",
        value: 'Ref to "' + optionTypeName + '"',
      };
    }
  } else if (typeName === "collections.OrderedDict") {
    return {
      type: "collections.OrderedDict",
      value: {
        "py/reduce": [
          { "py/type": "collections.OrderedDict" },
          { "py/tuple": [[]] },
          null,
          null,
          null,
        ],
      },
    };
  } else if (typeName === "ros_bt_py.ros_helpers.LoggerLevel") {
    return {
      type: "ros_bt_py.ros_helpers.LoggerLevel",
      value: {
        "py/object": "ros_bt_py.ros_helpers.LoggerLevel",
        logger_level: 1,
      },
    };
  } else if (typeName === "ros_bt_py.helpers.MathUnaryOperator") {
    return {
      type: "ros_bt_py.helpers.MathUnaryOperator",
      value: {
        "py/object": "ros_bt_py.helpers.MathUnaryOperator",
        operator: "sqrt",
      },
    };
  } else if (typeName === "ros_bt_py.helpers.MathBinaryOperator") {
    return {
      type: "ros_bt_py.helpers.MathBinaryOperator",
      value: {
        "py/object": "ros_bt_py.helpers.MathBinaryOperator",
        operator: "+",
      },
    };
  } else if (typeName === "ros_bt_py.helpers.MathOperandType") {
    return {
      type: "ros_bt_py.helpers.MathOperandType",
      value: {
        "py/object": "ros_bt_py.helpers.MathOperandType",
        operand_type: "float",
      },
    };
  } else if (typeName === "ros_bt_py.helpers.MathUnaryOperandType") {
    return {
      type: "ros_bt_py.helpers.MathUnaryOperandType",
      value: {
        "py/object": "ros_bt_py.helpers.MathUnaryOperandType",
        operand_type: "float",
      },
    };
  } else if (typeName === "ros_bt_py.ros_helpers.EnumValue") {
    return {
      type: "ros_bt_py.ros_helpers.EnumValue",
      value: {
        "py/object": "ros_bt_py.ros_helpers.EnumValue",
        enum_value: "",
        field_names: [],
      },
    };
  } else {
    return {
      type: "__" + typeName,
      value: {},
    };
  }
}

// Get the distance between two sets of coordinates (expected to be
// arrays with 2 elements each)
export function getDist(a: number[], b: number[]) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export function treeIsEditable(tree_msg: TreeMsg) {
  return tree_msg.state === "EDITABLE";
}

export function selectIOGripper(
  vertex_selection: d3.Selection<
    SVGGElement,
    unknown,
    d3.BaseType,
    unknown
  >,
  data: NodeDataLocation
) {
  return vertex_selection
    .selectAll<SVGGElement, DataEdgeTerminal>(
      "." +
        data.data_kind.substring(0, data.data_kind.length - 1) +
        "-gripper-group"
    )
    .filter((d: DataEdgeTerminal) => d.nodeName === data.node_name)
    .filter((d: DataEdgeTerminal) => d.key === data.data_key);
}

export function getMessageType(str: string) {
  let message_type = str;
  const msg_string = ".msg._";
  let first_index = message_type.indexOf(msg_string);
  let service = false;
  if (first_index == -1) {
    first_index = message_type.indexOf(".srv._");
    service = true;
  }
  const package_name = message_type.substr(0, first_index);
  const second_index = message_type.indexOf(
    ".",
    first_index + msg_string.length
  );
  const message_name = message_type.substr(second_index + 1);
  message_type = package_name + "/" + message_name;
  return { message_type: message_type, service: service };
}

export function getShortDoc(doc: string) {
  if (!doc || doc == null || doc.length == 0) {
    return "No documentation provided";
  } else {
    const index = doc.indexOf("**Behavior Tree I/O keys**");
    if (index < 0) {
      return doc;
    } else {
      return doc.substring(0, index).trim();
    }
  }
}
