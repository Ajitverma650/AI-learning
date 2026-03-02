import React, { useState } from 'react';
import { Upload, FileText, Send, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/rag';

export default function App() {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setDocumentId(null);
      setAnswer('');
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDocumentId(data.documentId);
        alert('PDF uploaded and processed successfully!');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Make sure the backend is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!documentId || !question.trim()) return;
    
    setLoading(true);
    setAnswer('');

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          question: question.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnswer(data.answer);
      } else {
        setAnswer('Error: ' + (data.error || 'Failed to get answer'));
      }
    } catch (error) {
      console.error('Question error:', error);
      setAnswer('Error: Failed to get answer. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="text-purple-400" size={40} />
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ask My PDF
            </h1>
          </div>
          <p className="text-slate-300">Upload a PDF and ask questions about its content</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Upload size={24} />
            Upload PDF
          </h2>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-500 file:text-white
                hover:file:bg-purple-600 file:cursor-pointer
                cursor-pointer"
            />
            
            {file && (
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                <span className="text-sm text-slate-300 truncate">{file.name}</span>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            )}
            
            {documentId && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-300 font-semibold">✓ Document processed successfully!</p>
                <p className="text-xs text-green-200 mt-1">You can now ask questions about this PDF</p>
              </div>
            )}
          </div>
        </div>

        {/* Question Section */}
        {documentId && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Send size={24} />
              Ask a Question
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="What would you like to know about this document?"
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={loading || !question.trim()}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              
              {answer && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">Answer:</h3>
                  <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}