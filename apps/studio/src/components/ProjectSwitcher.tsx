/**
 * ProjectSwitcher Component
 * 
 * Dropdown for switching between projects and creating new ones.
 * Only visible when user is authenticated and using cloud storage.
 */

import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProjectSwitcher() {
  const { isAuthenticated } = useAuth();
  const { currentProject, switchProject, createAndSwitchProject, isLoading } = useProject();
  const { projects, loadProjects } = useProjects({ autoLoad: true });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Don't show if not authenticated
  if (!isAuthenticated || !currentProject) {
    return null;
  }

  const handleSwitchProject = async (projectId: string) => {
    try {
      await switchProject(projectId);
    } catch (error) {
      
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      await createAndSwitchProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      await loadProjects(1);
    } catch (error) {
      
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={isLoading}>
            <FolderOpen className="h-4 w-4" />
            <span className="max-w-[150px] truncate">{currentProject.name}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>切换项目</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleSwitchProject(project.id)}
              className={currentProject.id === project.id ? 'bg-accent' : ''}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{project.name}</span>
                {project.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {project.description}
                  </span>
                )}
                {project._count && (
                  <span className="text-xs text-muted-foreground">
                    {project._count.dashboards} 个画布
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建项目</DialogTitle>
            <DialogDescription>
              创建一个新项目来组织您的画布。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                placeholder="我的项目"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                placeholder="项目描述"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreating}
            >
              {isCreating ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
