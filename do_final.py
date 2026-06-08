import sys, os
sys.stdout.reconfigure(encoding="utf-8")

# Read the git-clean file
with open("src/app/expenses/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

sq = chr(39)

# Find key lines
state_idx = None
fetch_idx = None
list_div_idx = None
close_idx = None

for i, line in enumerate(lines):
    if "const [pendingCount, setPendingCount] = useState(0);" in line:
        state_idx = i
    if "fetching ? (" in line and i > 100:
        fetch_idx = i
    if 'className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"' in line:
        list_div_idx = i
    # Find the )} that closes the ternary (before main container </div>)
    if list_div_idx is not None and i > list_div_idx and ")}" in line:
        # Check the following lines for the main container close
        for j in range(i+1, min(i+5, len(lines))):
            if "</div>" in lines[j]:
                close_idx = i
                break
        if close_idx:
            break

print(f"state={state_idx}, fetch={fetch_idx}, list_div={list_div_idx}, close={close_idx}")

if not all([state_idx, list_div_idx, close_idx]):
    print("ERROR: Could not find required sections")
    sys.exit(1)

# Insert previewImg state and categoryEmoji after state_idx
insert_after = state_idx + 1
preview_state = "  const [previewImg, setPreviewImg] = useState<string | null>(null);\n"
emoji_fn = f"  const categoryEmoji = (cat: string): string => {{\n    const map: Record<string, string> = {{\n"
pairs = [("餐饮", "\U0001f37d\ufe0f"), ("交通", "\U0001f697"), ("购物", "\U0001f6cd\ufe0f"), ("医疗", "\U0001f489"), ("娱乐", "\U0001f3ae"), ("居住", "\U0001f3e0"), ("通讯", "\U0001f4f1"), ("教育", "\U0001f4da")]
for cn, ce in pairs:
    emoji_fn += f"      {sq}{cn}{sq}: {sq}{ce}{sq},\n"
emoji_fn += f"    }};\n    return map[cat] || {sq}\U0001f4c4{sq};\n  }};\n\n"

new_lines = lines[:state_idx+1] + ["\n", preview_state, "\n", emoji_fn] + lines[state_idx+1:]

# Adjust indices since we inserted lines
if fetch_idx > state_idx: fetch_idx += 3
if list_div_idx > state_idx: list_div_idx += 3
if close_idx > state_idx: close_idx += 3

# Replace the old list grid with card grid
# The old content is from list_div_idx to close_idx (inclusive)
EMPTY = "\u6ca1\u6709\u8d26\u5355\u8bb0\u5f55"
DEL = "\u5220\u9664"
CONFIRM = "\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u8bb0\u5f55\uff1f"

card_lines = [
    f'          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">\n',
    f'            {{expenses.map((item) => (\n',
    f'              <div\n',
    f'                key={{item._id}}\n',
    f'                onClick={{() => setPreviewImg(item.imageUrl)}}\n',
    f'                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"\n',
    f'              >\n',
    f'                <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">\n',
    f'                  {{item.imageUrl ? (\n',
    f'                    <img src={{item.imageUrl}} alt="" className="w-full h-full object-cover" />\n',
    f'                  ) : (\n',
    f'                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">{{categoryEmoji(item.category)}}</div>\n',
    f'                  )}}\n',
    f'                  <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur text-gray-700 font-medium shadow-sm">\n',
    f'                    {{item.category}}\n',
    f'                  </span>\n',
    f'                </div>\n',
    f'                <div className="p-2.5 sm:p-3">\n',
    f'                  <p className="text-base sm:text-lg font-bold text-blue-600 leading-tight">HK$ {{item.amount.toFixed(2)}}</p>\n',
    f'                  {{item.merchant && <p className="text-xs text-gray-500 mt-0.5 truncate">{{item.merchant}}</p>}}\n',
    f'                  <div className="flex items-center justify-between mt-1.5">\n',
    f'                    <span className="text-[10px] text-gray-400">{{item.billDate || ""}}</span>\n',
    f'                    <button\n',
    f'                      onClick={{(e) => {{ e.stopPropagation(); if (confirm({sq}{CONFIRM}{sq})) deleteExpense(item._id); }}}}\n',
    f'                      className="text-[10px] text-red-300 hover:text-red-500"\n',
    f'                    >{DEL}</button>\n',
    f'                  </div>\n',
    f'                </div>\n',
    f'              </div>\n',
    '            ))}\n',
    f'          </div>',
]
card_content = "".join(card_lines)

# Replace lines from list_div_idx to close_idx with card_content
new_lines2 = new_lines[:list_div_idx] + [card_content] + new_lines[close_idx+1:]

# Add lightbox before the closing </div> of the main container
# Find where the last </div> before "  );" is
for i in range(len(new_lines2)-1, -1, -1):
    if new_lines2[i].strip() == "</div>" and i < len(new_lines2)-2 and new_lines2[i+1].strip().startswith(");"):
        # Insert lightbox before this line
        lb_lines = [
            f'      {{/* Image lightbox */}}\n',
            f'      {{previewImg && (\n',
            f'        <div\n',
            f'          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2"\n',
            f'          onClick={{() => setPreviewImg(null)}}\n',
            f'        >\n',
            f'          <button\n',
            f'            onClick={{() => setPreviewImg(null)}}\n',
            f'            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-xl z-10 hover:bg-white/30"\n',
            f'          >\u2715</button>\n',
            f'          <div className="max-w-full max-h-full overflow-auto" onClick={{(e) => e.stopPropagation()}}>\n',
            f'            <img\n',
            f'              src={{previewImg}}\n',
            f'              alt=""\n',
            f'              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"\n',
            f'              style={{{{ touchAction: {sq}manipulation{sq} }}}}\n',
            f'              draggable={{false}}\n',
            f'            />\n',
            f'          </div>\n',
            f'        </div>\n',
            f'      )}}\n',
        ]
        new_lines2 = new_lines2[:i] + lb_lines + new_lines2[i:]
        break

with open("src/app/expenses/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines2)
print(f"Done! Total lines: {len(new_lines2)}")