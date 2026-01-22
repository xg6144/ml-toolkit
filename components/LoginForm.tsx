import React, { useState } from 'react';
import { StudentUser } from '../types';
import { GRADES } from '../constants';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface LoginFormProps {
  onLogin: (user: StudentUser) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school.trim() || !grade || !name.trim()) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school, grade, name })
      });

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData); // Should include ID now
      } else {
        const errData = await response.json();
        setError(errData.error || '로그인 실패');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결 실패');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="bg-university-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-university-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI 실습실 입장</h2>
        <p className="text-gray-500 mt-2 text-sm">학교, 학년, 이름을 입력하여 시작하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="학교명"
          placeholder="예: 한국중학교"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />

        <Select
          label="학년"
          options={GRADES}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />

        <Input
          label="이름"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-4 h-12 text-lg">
          입장하기
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
