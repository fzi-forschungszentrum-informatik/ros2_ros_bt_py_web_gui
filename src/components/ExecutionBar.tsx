import { TreeExecutionCommands } from "../types/services/ControlTreeExecution";
import { TreeMsg } from "../types/types";
import { DebugControls } from "./DebugControls";
import { LoadSaveControls } from "./LoadSaveControls";
import { NamespaceSelect } from "./NamespaceSelect";
import { Spacer } from "./Spacer";
import { TickControls } from "./TickControls";

interface ExecutionBarProps {
    ros: ROSLIB.Ros,
    ros_url: string,
    connected: boolean,
    packages_available: boolean,
    messages_available: boolean,
    currentNamespace: string,
    onNamespaceChange: (namespace: string) => void,
    onError: (error_msg: string) => void,
    subtreeNames: string[],
    tree_message: TreeMsg | null,
    onSelectedTreeChange: (is_subtree: boolean, name: string) => void,
    runningCommands: Set<TreeExecutionCommands>,
    onNewRunningCommand: (command: TreeExecutionCommands) => void,
    onRunningCommandCompleted: (command: TreeExecutionCommands) => void
    onPublishingSubtreesChange: (enable: boolean) => void
    onChangeFileModal: (mode: string | null) => void
}

export function ExecutionBar(props: ExecutionBarProps) {
    return (
        <header id="header" className="d-flex flex-column flex-md-row align-items-center control-bar">
            <NamespaceSelect
                ros={props.ros}
                ros_url={props.ros_url}
                connected={props.connected}
                packages_available={props.packages_available}
                messages_available={props.messages_available}
                currentNamespace={props.currentNamespace}
                onNamespaceChange={props.onNamespaceChange}
                onError={props.onError} />
            <DebugControls
                ros={props.ros}
                bt_namespace={props.currentNamespace}
                onError={props.onError}
                onPublishingSubtreesChange={props.onPublishingSubtreesChange} />
            <TickControls
                ros={props.ros}
                bt_namespace={props.currentNamespace}
                runningCommands={props.runningCommands}
                onNewRunningCommand={props.onNewRunningCommand}
                onRunningCommandCompleted={props.onRunningCommandCompleted}
                onError={props.onError} />
            <Spacer />
            <LoadSaveControls
                ros={props.ros}
                bt_namespace={props.currentNamespace}
                tree_message={props.tree_message}
                onError={props.onError}
                onNewRunningCommand={props.onNewRunningCommand}
                onRunningCommandCompleted={props.onRunningCommandCompleted}
                onChangeFileModal={props.onChangeFileModal} />
        </header>
    );
}
