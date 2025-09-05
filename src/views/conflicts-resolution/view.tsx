import { IconName, ItemView, Menu, Platform, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import GitHubSyncPlugin from "src/main";
import { ConflictFile, ConflictResolution } from "src/sync-manager";
import SplitView from "./split-view/split-view";
import UnifiedView from "./unified-view/unified-view";
import * as React from "react";

export interface ViewHandle {
	acceptRemote: () => void;
	overwriteRemote: () => void;
}

export const CONFLICTS_RESOLUTION_VIEW_TYPE = "conflicts-resolution-view";

export class ConflictsResolutionView extends ItemView {
	icon: IconName = "merge";
	private root: Root | null = null;
	private componentRef = React.createRef<ViewHandle>();

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: GitHubSyncPlugin,
		private conflicts: ConflictFile[],
	) {
		super(leaf);
	}

	getViewType() {
		return CONFLICTS_RESOLUTION_VIEW_TYPE;
	}

	getDisplayText() {
		return "Conflicts resolution";
	}

	private resolveAllConflicts(resolutions: ConflictResolution[]) {
		if (this.plugin.conflictsResolver) {
			this.plugin.conflictsResolver(resolutions);
			this.plugin.conflictsResolver = null;
		}
	}

	setConflictFiles(conflicts: ConflictFile[]) {
		this.conflicts = conflicts;
		this.render(conflicts);
	}

	acceptRemoteForSelectedFile() {
		this.componentRef.current?.acceptRemote();
	}

	overwriteRemoteForSelectedFile() {
		this.componentRef.current?.overwriteRemote();
	}

	async onOpen() {
		this.render(this.conflicts);
	}

	private render(conflicts: ConflictFile[]) {
		if (!this.root) {
			// Hides the navigation header
			(this.containerEl.children[0] as HTMLElement).className =
				"hidden-navigation-header";
			const container = this.containerEl.children[1];
			container.empty();
			// We don't want any padding, the DiffView component will handle that
			(container as HTMLElement).className = "padless-conflicts-view-container";
			this.root = createRoot(container);
		}

		let diffMode = "default";
		if (this.plugin.settings.conflictViewMode === "default") {
			if (Platform.isMobile) {
				diffMode = "unified";
			} else {
				diffMode = "split";
			}
		} else if (this.plugin.settings.conflictViewMode === "split") {
			diffMode = "split";
		} else if (this.plugin.settings.conflictViewMode === "unified") {
			diffMode = "unified";
		}

		if (diffMode === "split") {
			this.root.render(
				<SplitView
					ref={this.componentRef}
					initialFiles={conflicts}
					onResolveAllConflicts={this.resolveAllConflicts.bind(this)}
				/>,
			);
		} else {
			this.root.render(
				<UnifiedView
					ref={this.componentRef}
					initialFiles={conflicts}
					onResolveAllConflicts={this.resolveAllConflicts.bind(this)}
				/>,
			);
		}
	}

	async onClose() {
		// Nothing to clean up.
	}
}
