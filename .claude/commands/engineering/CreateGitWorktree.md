Follow these steps to create a git worktree.

Get the current project's folder name.

Create a folder adjacent to the current project's folder and name it {current project folder name}-worktrees. For example, if the current project folder is named myapp, create a folder called myapp-worktrees. Both myapp and myapp-worktrees should have the same parent folder.

Create a git worktree and branch named $ARGUMENTS from the main project folder and save it inside the {current project folder name}-worktrees folder that was created.

cd into the new $ARGUMENTS worktree folder.