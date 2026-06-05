import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">上传媒体</h1>
        <p className="mt-2 text-gray-500">支持图片和视频格式，上传到云端并添加标签</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <UploadForm />
      </div>

      {/* 支持的格式说明 */}
      <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">支持的文件格式</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700 mb-1">图片</p>
            <ul className="text-blue-600/70 space-y-0.5">
              <li>JPG / JPEG</li>
              <li>PNG</li>
              <li>GIF</li>
              <li>WebP</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-purple-700 mb-1">视频</p>
            <ul className="text-purple-600/70 space-y-0.5">
              <li>MP4</li>
              <li>WebM</li>
              <li>MOV</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
