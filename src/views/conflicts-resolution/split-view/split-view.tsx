import * as React from "react";
import { ConflictFile, ConflictResolution } from "src/sync-manager";
import DiffView from "./diff-view";
import FilesTabBar from "./files-tab-bar";
import { ViewHandle } from "../view";

const SplitView = React.forwardRef<
	ViewHandle,
	{
		initialFiles: ConflictFile[];
		onResolveAllConflicts: (resolutions: ConflictResolution[]) => void;
	}>
	(({ initialFiles, onResolveAllConflicts }, ref) => {
		const [files, setFiles] = React.useState(initialFiles);
		const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
		const [resolvedConflicts, setResolvedConflicts] = React.useState<
			ConflictResolution[]
		>([]);

		React.useImperativeHandle(ref, () => ({
			acceptRemote: () => {
				const newFiles = files;
				newFiles[currentFileIndex].localContent = newFiles[currentFileIndex].remoteContent;
				setFiles(newFiles);
				onConflictResolved()
			},
			overwriteRemote: () => {
				// dont' do anything with remote content
				onConflictResolved();
			}
		}))

		const onConflictResolved = () => {
			// Remove the file from the conflicts to resolve
			const remainingFiles = files.filter(
				(_, index) => index !== currentFileIndex,
			);
			setFiles(remainingFiles);
			// Keep track of the resolved conflicts
			const newResolvedConflicts = [
				...resolvedConflicts,
				{
					filePath: files[currentFileIndex]!.filePath,
					content: files[currentFileIndex]!.localContent,
				},
			];
			setResolvedConflicts(newResolvedConflicts);
			if (remainingFiles.length === 0) {
				// We solved all conflicts, we can resume syncing
				onResolveAllConflicts(newResolvedConflicts);
			}
		};

		return (
			<React.StrictMode>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						height: "100%",
						justifyContent: "center",
					}}
				>
					{files.length === 0 ? (
						<div
							style={{
								position: "relative",
								textAlign: "center",
								alignSelf: "center",
							}}
						>
							<div
								style={{
									margin: "20px 0",
									fontWeight: "var(--h2-weight)",
									fontSize: "var(--h2-size)",
									lineHeight: "var(--line-height-tight)",
								}}
							>
								No conflicts to resolve
							</div>
							<div
								style={{
									margin: "20px 0",
									fontSize: "var(--font-text-size)",
									color: "var(--text-muted)",
									lineHeight: "var(--line-height-tight)",
								}}
							>
								That's good, keep going
							</div>
						</div>
					) : (
						<>
							<FilesTabBar
								files={files.map((f) => f.filePath)}
								currentFile={files[currentFileIndex]?.filePath || ""}
								setCurrentFileIndex={setCurrentFileIndex}
							/>
							<div
								style={{
									overflow: "auto",
									flex: 1,
								}}
							>
								<DiffView
									remoteText={files[currentFileIndex]?.remoteContent || ""}
									localText={files[currentFileIndex]?.localContent || ""}
									onRemoteTextChange={(content: string) => {
										const tempFiles = [...files];
										tempFiles[currentFileIndex].remoteContent = content;
										setFiles(tempFiles);
									}}
									onLocalTextChange={(content: string) => {
										const tempFiles = [...files];
										tempFiles[currentFileIndex].localContent = content;
										setFiles(tempFiles);
									}}
									onConflictResolved={onConflictResolved}
								/>
							</div>
						</>
					)}
				</div>
			</React.StrictMode>
		);
	});

export default SplitView;
