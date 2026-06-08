import sys
sys.stdout.reconfigure(encoding='utf-8')
# Read the clean git version
with open('src/app/expenses/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
# Find positions
idx = content.find('const deleteExpense = ')
if idx < 0: print('ERROR'); sys.exit(1)
# Add previewImg and categoryEmoji
pre = """const [previewImg, setPreviewImg] = useState<string | null>(null);

const categoryEmoji = (cat: string): string => {
  const map: Record<string, string> = {
    '餐饮': '\U0001f37d\ufe0f',
    '交通': '\U0001f697',
    '购物': '\U0001f6cd\ufe0f',
    '医疗': '\U0001f489',
    '娱乐': '\U0001f3ae',
    '居住': '\U0001f3e0',
    '通讯': '\U0001f4f1',
    '教育': '\U0001f4da',
  };
  return map[cat] || '\U0001f4c4';
};

"""
content = content[:idx] + pre + content[idx:]

# Find and replace the list section
fidx = content.find('fetching ? (')
if fidx < 0: print('ERROR fetching'); sys.exit(1)
rest = content[fidx:]
depth = 0
tend = -1
for i, ch in enumerate(rest):
    if ch == '(': depth += 1
    elif ch == ')':
        depth -= 1
        if depth < 0: tend = fidx + i + 1; break
if tend < 0: print('ERROR ternary end'); sys.exit(1)

# Build new list section
EMPTY = '\u6ca1\u6709\u8d26\u5355\u8bb0\u5f55'
UPLOAD = '\u4e0a\u4f20\u65b0\u5355\u636e'
DEL = '\u5220\u9664'
CONFIRM = '\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u8bb0\u5f55\uff1f'

new_list = f"""fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">""" + '{monthLabel}' + ' ' + EMPTY + """</p>
          <Link href="/expenses/upload" className="mt-2 inline-block text-sm text-blue-600">""" + UPLOAD + """ \u2192</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {expenses.map((item) => (
            <div
              key={item._id}
              onClick={() => setPreviewImg(item.imageUrl)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">{categoryEmoji(item.category)}</div>
                )}
                <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur text-gray-700 font-medium shadow-sm">
                  {item.category}
                </span>
              </div>
              <div className="p-2.5 sm:p-3">
                <p className="text-base sm:text-lg font-bold text-blue-600 leading-tight">HK$ {item.amount.toFixed(2)}</p>
                {item.merchant && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.merchant}</p>}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">{item.billDate || ''}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('{CONFIRM}')) deleteExpense(item._id); }}
                    className="text-[10px] text-red-300 hover:text-red-500"
                  >{DEL}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )"""

content = content[:fidx] + new_list + content[tend:]

# Add lightbox
end_idx = content.rfind('</div>' + chr(10) + '  );')
if end_idx > 0:
    lb = """
      {/* Image lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-xl z-10 hover:bg-white/30"
          >\u2715</button>
          <div className="max-w-full max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImg}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
              style={{ touchAction: 'manipulation' }}
              draggable={false}
            />
          </div>
        </div>
      )}
"""
    content = content[:end_idx] + lb + content[end_idx:]

with open('src/app/expenses/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
