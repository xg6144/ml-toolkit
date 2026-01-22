import React, { useState, useEffect } from 'react';
import { StudentUser, Project } from '../types';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';

interface ProjectDashboardProps {
  user: StudentUser;
  onSelectProject: (project: Project) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ user, onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    const userId = (user as any).id;
    if (userId) {
      fetch(`/api/projects/${userId}`)
        .then(res => res.json())
        .then(data => {
          // Convert date strings to Date objects
          const formatted = data.map((p: any) => ({
            ...p,
            createdAt: new Date(p.created_at)
          }));
          setProjects(formatted);
        })
        .catch(err => console.error("Failed to fetch projects", err));
    }
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: (user as any).id,
          title: newProjectTitle,
          description: '새로 생성된 AI 실습 프로젝트입니다.',
          type: 'chat'
        })
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([{ ...newProject, createdAt: new Date(newProject.created_at) }, ...projects]);
        setNewProjectTitle('');
        setIsCreating(false);
      } else {
        alert("프로젝트 생성 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">


      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-university-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            내 프로젝트
          </h2>
          <Button onClick={() => setIsCreating(true)} variant="primary">
            + 새 프로젝트
          </Button>
        </div>

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          title="새 프로젝트 생성"
        >
          <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                새로운 AI 실습 프로젝트를 생성합니다.<br />
                프로젝트의 주제나 목표를 이름으로 정해보세요.
              </p>
              <Input
                label="프로젝트 이름"
                placeholder="예: 미래 도시 설계하기"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>
                취소
              </Button>
              <Button type="submit">
                생성하기
              </Button>
            </div>
          </form>
        </Modal>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-university-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${project.type === 'chat' ? 'bg-blue-100 text-blue-600' :
                  project.type === 'vision' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                  {project.type === 'chat' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {project.createdAt.toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-university-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {project.description}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <span className="text-sm font-medium text-university-600 flex items-center">
                  실습 시작하기
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
