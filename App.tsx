import React, { useState } from 'react';
import { StudentUser, Project, Dataset } from './types';
import LoginForm from './components/LoginForm';
import FlowWorkspace from './components/FlowWorkspace';
import ProjectDashboard from './components/ProjectDashboard';
import Modal from './components/Modal';
import DatasetViewer from './components/DatasetViewer';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [dashboardView, setDashboardView] = useState<'projects' | 'datasets'>('projects');
  const [savedDatasets, setSavedDatasets] = useState<Dataset[]>([]);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDatasetType, setSelectedDatasetType] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [uploadMode, setUploadMode] = useState<'single' | 'split'>('single');
  const [uploadedFiles, setUploadedFiles] = useState<{
    single?: { file: File, parsedData: string[][] },
    splits?: {
      train?: { file: File, parsedData: string[][] },
      validation?: { file: File, parsedData: string[][] },
      test?: { file: File, parsedData: string[][] }
    }
  } | null>(null);

  const [datasetData, setDatasetData] = useState<{
    name: string;
    splits: { train?: string[][], validation?: string[][], test?: string[][] };
    fileName?: string;
    type?: string;
    data?: string[][]; // For backward compatibility / display
  } | null>(null);

  const resetUploadModal = () => {
    setDatasetName('');
    setUploadMode('single');
    setUploadedFiles(null);
    setIsUploadModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'single' | 'split', splitType?: 'train' | 'validation' | 'test') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));

      if (mode === 'single') {
        setUploadedFiles({
          single: { file, parsedData: rows }
        });
      } else if (splitType) {
        setUploadedFiles(prev => ({
          ...prev,
          splits: {
            ...prev?.splits,
            [splitType]: { file, parsedData: rows }
          }
        }));
      }
    };
    reader.readAsText(file);
  };

  // Restore session
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  const handleLogin = (userData: StudentUser) => {
    setUser(userData);
    localStorage.setItem('user_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      setUser(null);
      setCurrentProject(null);
      localStorage.removeItem('user_session');
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
  };

  const handleBackToDashboard = () => {
    if (confirm('프로젝트를 종료하고 대시보드로 돌아가시겠습니까? 저장되지 않은 변경사항은 사라질 수 있습니다.')) {
      setCurrentProject(null);
    }
  };

  // Fetch datasets when view changes to 'datasets'
  React.useEffect(() => {
    if (dashboardView === 'datasets' && user) {
      fetch(`http://localhost:3001/api/datasets?studentId=${user.id}`)
        .then(res => res.json())
        .then(data => setSavedDatasets(data))
        .catch(err => console.error("Failed to fetch datasets", err));
    }
  }, [dashboardView, user]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navigation Bar - Only show when not in project workspace */}
      {!currentProject && (
        <nav className="bg-white border-b border-gray-200 px-4 py-3 z-50 flex-none">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="bg-university-600 text-white p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="font-bold text-gray-800 text-lg tracking-tight">{APP_NAME}</span>
              </div>

              {/* Navigation Tabs */}
              {user && (
                <div className="hidden md:flex space-x-1">
                  <button
                    onClick={() => setDashboardView('projects')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dashboardView === 'projects'
                      ? 'bg-gray-100 text-university-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    프로젝트
                  </button>
                  <button
                    onClick={() => setDashboardView('datasets')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${dashboardView === 'datasets'
                      ? 'bg-gray-100 text-university-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    데이터셋
                  </button>
                </div>
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.school}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col w-full overflow-hidden ${currentProject ? 'p-0' : 'p-4 md:p-6 max-w-7xl mx-auto'}`}>
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up w-full">
            <LoginForm onLogin={handleLogin} />
          </div>
        ) : !currentProject ? (
          <div className="w-full h-full">
            {dashboardView === 'projects' ? (
              <ProjectDashboard user={user} onSelectProject={handleSelectProject} />
            ) : datasetData ? (
              <DatasetViewer
                data={datasetData.data}
                splits={datasetData.splits}
                name={datasetData.name}
                fileName={datasetData.fileName}
                onBack={() => setDatasetData(null)}
                onSave={async (name, isPublic) => {
                  if (!user) {
                    alert('로그인이 필요합니다.');
                    return;
                  }

                  try {
                    const content = JSON.stringify(datasetData.splits ? { splits: datasetData.splits } : { data: datasetData.data });

                    const response = await fetch('http://localhost:3001/api/datasets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        owner_id: user.id, // Using user ID from session
                        name: name,
                        type: datasetData.type || 'tabular',
                        content: content,
                        is_public: isPublic
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Failed to save dataset');
                    }

                    alert('데이터셋이 저장되었습니다!');
                    // Refresh datasets
                    fetch(`http://localhost:3001/api/datasets?studentId=${user.id}`)
                      .then(res => res.json())
                      .then(data => setSavedDatasets(data));
                  } catch (error) {
                    console.error('Error saving dataset:', error);
                    alert('데이터셋 저장 중 오류가 발생했습니다.');
                  }
                }}
              />
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-university-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    내 데이터셋
                  </h2>
                  <button
                    onClick={() => setIsDatasetModalOpen(true)}
                    className="px-4 py-2 bg-university-600 text-white rounded-lg hover:bg-university-700 transition-colors font-medium text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    데이터 추가
                  </button>
                </div>

                {/* Dataset List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                  {savedDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-university-300 transition-all cursor-pointer p-6 flex flex-col h-full"
                      onClick={() => {
                        try {
                          const parsedContent = JSON.parse(dataset.content);
                          setDatasetData({
                            name: dataset.name,
                            type: dataset.type,
                            data: parsedContent.data,
                            splits: parsedContent.splits,
                            fileName: dataset.name
                          });
                        } catch (e) {
                          console.error("Failed to parse dataset content", e);
                          alert("데이터셋을 불러오는 중 오류가 발생했습니다.");
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7-6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                          </svg>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${dataset.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {dataset.is_public ? '전체 공개' : '비공개'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{dataset.name}</h3>
                      <p className="text-sm text-gray-500 mb-4 flex-1">
                        {dataset.type === 'tabular' ? '정형 데이터 (Tabular)' : dataset.type}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50">
                        <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                        <span>{dataset.owner_id === user.id ? '나' : '다른 사용자'}</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty State if no datasets */}
                  {savedDatasets.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">데이터셋 관리</h3>
                      <p className="text-gray-500 mb-6">아직 업로드된 데이터셋이 없습니다.</p>
                    </div>
                  )}
                </div>

                {/* Dataset Type Selection Modal */}
                <Modal
                  isOpen={isDatasetModalOpen}
                  onClose={() => setIsDatasetModalOpen(false)}
                  title="데이터셋 유형 선택"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'tabular', label: '정형 데이터 (Tabular)', desc: 'CSV, Excel 등 표 형식 데이터', icon: 'M3 10h18M3 14h18m-9-4v8m-7-6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z' },
                      { type: 'image', label: '이미지 (Image)', desc: 'JPEG, PNG 등 이미지 파일', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                      { type: 'text', label: '텍스트 (Text)', desc: 'TXT, JSON 등 자연어 데이터', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { type: 'audio', label: '오디오 (Audio)', desc: 'MP3, WAV 등 음성 데이터', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' }
                    ].map((item) => (
                      <div
                        key={item.type}
                        className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-university-500 hover:bg-university-50 transition-all group flex flex-col items-center text-center"
                        onClick={() => {
                          setSelectedDatasetType(item.type);
                          setIsDatasetModalOpen(false);
                          setIsUploadModalOpen(true);
                        }}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-university-100 text-gray-500 group-hover:text-university-600 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-1">{item.label}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </Modal>

                {/* File Upload Modal */}
                <Modal
                  isOpen={isUploadModalOpen}
                  onClose={resetUploadModal}
                  title={`${selectedDatasetType === 'tabular' ? '정형 데이터' :
                    selectedDatasetType === 'image' ? '이미지 데이터' :
                      selectedDatasetType === 'text' ? '텍스트 데이터' : '오디오 데이터'} 업로드`}
                >
                  <div className="space-y-4">
                    {/* Dataset Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        데이터셋 이름
                      </label>
                      <input
                        type="text"
                        placeholder="예: Iris Flower Dataset"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-university-500 focus:border-transparent outline-none transition-all"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                      />
                    </div>

                    {/* Upload Mode Selection */}
                    {selectedDatasetType === 'tabular' && (
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={() => { setUploadMode('single'); setUploadedFiles(null); }} // Reset files when changing mode
                        >
                          단일 파일
                        </button>
                        <button
                          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMode === 'split' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={() => { setUploadMode('split'); setUploadedFiles(null); }} // Reset files when changing mode
                        >
                          학습/검증/평가 분리
                        </button>
                      </div>
                    )}

                    {/* File Upload Area */}
                    {uploadMode === 'single' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadedFiles?.single ? `파일 선택됨: ${uploadedFiles.single.file.name}` : '단일 파일 업로드'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedDatasetType === 'tabular' ? 'CSV, Excel 파일 (최대 10MB)' : '지원되는 파일 형식'}
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          id="file-upload-single"
                          accept={selectedDatasetType === 'tabular' ? '.csv' : undefined}
                          onChange={(e) => handleFileUpload(e, 'single')}
                        />
                        <label htmlFor="file-upload-single" className="block w-full h-full absolute inset-0 cursor-pointer"></label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {['train', 'validation', 'test'].map((type) => (
                          <div key={type} className="flex items-center space-x-3">
                            <span className="w-16 text-sm font-medium text-gray-600 capitalize text-right">
                              {type === 'train' ? '학습' : type === 'validation' ? '검증 (선택)' : '평가'}
                            </span>
                            <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-university-300 transition-colors relative cursor-pointer group">
                              <span className="text-sm text-gray-400">
                                {uploadedFiles?.splits?.[type as 'train' | 'validation' | 'test']
                                  ? `파일 선택됨: ${uploadedFiles.splits[type as 'train' | 'validation' | 'test']?.file.name}`
                                  : '파일 선택'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-university-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <input
                                type="file"
                                className="hidden"
                                id={`file-upload-${type}`}
                                accept={selectedDatasetType === 'tabular' ? '.csv' : undefined}
                                onChange={(e) => handleFileUpload(e, 'split', type as 'train' | 'validation' | 'test')}
                              />
                              <label htmlFor={`file-upload-${type}`} className="block w-full h-full absolute inset-0 cursor-pointer"></label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}


                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={resetUploadModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!datasetName.trim()) {
                            alert('데이터셋 이름을 입력해주세요.');
                            return;
                          }

                          let finalData: string[][] | undefined;
                          let finalFileName: string | undefined;
                          let finalSplits: { train: string[][], validation: string[][], test: string[][] } | undefined;

                          if (uploadMode === 'single' && uploadedFiles?.single) {
                            finalData = uploadedFiles.single.parsedData;
                            finalFileName = uploadedFiles.single.file.name;
                          } else if (uploadMode === 'split' && uploadedFiles?.splits?.train && uploadedFiles.splits.test) {
                            // Validation is optional
                            finalData = uploadedFiles.splits.train.parsedData;
                            finalFileName = uploadedFiles.splits.train.file.name;
                            finalSplits = {
                              train: uploadedFiles.splits.train.parsedData,
                              validation: uploadedFiles.splits.validation?.parsedData, // Optional
                              test: uploadedFiles.splits.test.parsedData,
                            };
                          } else {
                            alert('파일을 업로드해주세요.');
                            return;
                          }

                          if (!finalData || !finalFileName) {
                            alert('파일을 업로드해주세요.');
                            return;
                          }

                          setDatasetData({
                            data: finalData,
                            fileName: finalFileName,
                            name: datasetName,
                            type: selectedDatasetType || 'tabular',
                            splits: finalSplits,
                          });
                          resetUploadModal();
                          setDashboardView('datasets');
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-university-600 hover:bg-university-700 rounded-lg transition-colors"
                      >
                        완료
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            )}
          </div>
        ) : (
          <FlowWorkspace user={user} project={currentProject} onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
};

export default App;