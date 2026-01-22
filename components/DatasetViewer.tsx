import React, { useState, useEffect } from 'react';
import Button from './Button';

interface DatasetViewerProps {
    data?: string[][]; // Legacy / Single
    fileName?: string;
    splits?: { train?: string[][], validation?: string[][], test?: string[][] };
    name?: string; // Dataset name
    onBack: () => void;
    onSave?: (name: string, isPublic: boolean) => void;
}

const DatasetViewer: React.FC<DatasetViewerProps> = ({ data, fileName, splits, name, onBack, onSave }) => {
    const [activeSplit, setActiveSplit] = useState<'train' | 'validation' | 'test'>('train');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState(name || fileName || '');
    const [isPublic, setIsPublic] = useState(false);

    // Determine what to show
    // If splits exist, use activeSplit. If not, use data.
    const currentData = splits ? splits[activeSplit] : data;
    const currentFileName = fileName; // Could customize per split if we stored filenames per split

    // If we have splits but the active one is empty, try to switch to one that exists
    useEffect(() => {
        if (splits && !splits[activeSplit] && (splits.train || splits.validation || splits.test)) {
            if (splits.train) setActiveSplit('train');
            else if (splits.validation) setActiveSplit('validation');
            else if (splits.test) setActiveSplit('test');
        }
    }, [splits, activeSplit]);

    // Update saveName when props change
    useEffect(() => {
        if (name) setSaveName(name);
        else if (fileName) setSaveName(fileName);
    }, [name, fileName]);

    if (!currentData || currentData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-4">표시할 데이터가 없습니다.</p>
                <Button onClick={onBack} variant="secondary">돌아가기</Button>
            </div>
        );
    }

    const headers = currentData[0];
    const rows = currentData.slice(1);

    return (
        <div className="flex flex-col h-full bg-white animate-fade-in-up relative">
            {/* Save Modal */}
            {isSaveModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96 animate-scale-in">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">데이터셋 저장</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">데이터셋 이름</label>
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-university-500 focus:border-university-500"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">공개 설정</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsPublic(false)}
                                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${!isPublic ? 'bg-university-50 border-university-500 text-university-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    🔒 나만 보기
                                </button>
                                <button
                                    onClick={() => setIsPublic(true)}
                                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${isPublic ? 'bg-university-50 border-university-500 text-university-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    🌐 전체 공개
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (onSave) {
                                        onSave(saveName, isPublic);
                                        setIsSaveModalOpen(false);
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-university-600 hover:bg-university-700 rounded-md"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                        <Button onClick={onBack} variant="ghost" className="p-2 -ml-2 text-gray-500 hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <svg className="w-6 h-6 text-university-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {name || fileName || 'Dataset'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {rows.length} rows • {headers.length} columns
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {/* Save Button */}
                        {onSave && (
                            <Button variant="outline" onClick={() => setIsSaveModalOpen(true)}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                저장
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => alert('분석 기능은 준비 중입니다.')}>
                            데이터 분석
                        </Button>
                    </div>
                </div>

                {/* Tabs for Splits */}
                {splits && (
                    <div className="flex space-x-1 border-b border-gray-100">
                        {['train', 'validation', 'test'].map((split) => {
                            const hasData = !!splits[split as 'train' | 'validation' | 'test'];
                            if (!hasData) return null;

                            return (
                                <button
                                    key={split}
                                    onClick={() => setActiveSplit(split as any)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSplit === split
                                        ? 'border-university-600 text-university-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {split === 'train' ? '학습 데이터 (Train)' :
                                        split === 'validation' ? '검증 데이터 (Validation)' : '평가 데이터 (Test)'}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-50 border-r border-gray-200 w-16">
                                        #
                                    </th>
                                    {headers.map((header, index) => (
                                        <th
                                            key={index}
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono bg-gray-50 border-r border-gray-200 sticky left-0">
                                            {rowIndex + 1}
                                        </td>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetViewer;
