const fs = require('fs');

let content = fs.readFileSync('src/components/superadmin/ProductsList.tsx', 'utf8');

// Replace the custom media status cell with an actual thumbnail
const oldCell = `
                          {exp?.customImageUrl || exp?.customVideoUrl ? (
                            <div className="flex flex-col gap-1">
                              {exp.customImageUrl && <span className="text-success font-semibold">✓ تصویر اختصاصی</span>}
                              {exp.customVideoUrl && <span className="text-blue-600 font-semibold">✓ ویدیو اختصاصی</span>}
                            </div>
                          ) : (
                            <span className="text-muted italic">تصویر/ویدیوی اصلی کالا</span>
                          )}
`;

const newCell = `
                          {exp?.customImageUrl || exp?.customVideoUrl ? (
                            <div className="flex gap-2 items-center">
                              {exp.customImageUrl && (
                                <div className="relative group">
                                  <img src={exp.customImageUrl} className="w-12 h-12 rounded-lg object-cover border border-subtle shadow-sm" referrerPolicy="no-referrer" />
                                  <span className="absolute -bottom-2 -left-2 bg-success text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">عکس</span>
                                </div>
                              )}
                              {exp.customVideoUrl && (
                                <div className="relative group w-12 h-12 bg-slate-100 rounded-lg border border-subtle shadow-sm flex items-center justify-center overflow-hidden">
                                  <video src={exp.customVideoUrl} className="w-full h-full object-cover opacity-50" muted playsInline />
                                  <span className="absolute bg-blue-600/80 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">ویدیو</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted italic bg-slate-50 px-2 py-1 rounded text-[10px]">استفاده از رسانه اصلی کالا</span>
                          )}
`;

content = content.replace(oldCell, newCell);

// Also change file size limit in the modal
content = content.replace(/5 \* 1024 \* 1024/g, '20 * 1024 * 1024');

fs.writeFileSync('src/components/superadmin/ProductsList.tsx', content, 'utf8');
console.log('ProductsList patched for custom media preview');
