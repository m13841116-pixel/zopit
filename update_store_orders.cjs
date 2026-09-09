const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreOrders.tsx', 'utf8');

const target = `<div className="flex justify-between items-center">
                      <span className="text-muted">کد رهگیری مرسوله:</span>
                      <span className="font-mono font-bold text-primary-hover">
                        {selectedOrderForDetails.trackingCode || "در انتظار ارسال و صدور بارنامه"}
                      </span>
                    </div>`;

const replacement = `{selectedOrderForDetails.supplierOrderGroups && selectedOrderForDetails.supplierOrderGroups.length > 0 ? (
                      <div className="space-y-2 mt-4 pt-4 border-t border-subtle">
                        <span className="text-muted block mb-2 font-bold">رهگیری مرسولات (چند تامین‌کننده):</span>
                        {selectedOrderForDetails.supplierOrderGroups.map((group: any) => (
                          <div key={group.id} className="bg-surface p-3 rounded-xl border border-subtle">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-primary">{group.supplier?.brandName || group.supplier?.username}</span>
                              <span className={\`text-[10px] px-2 py-0.5 rounded-full \${group.status === 'SHIPPED' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'}\`}>
                                {group.status === 'SHIPPED' ? 'ارسال شده' : 'در حال پردازش'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-muted">حامل: </span>
                                <span className="font-bold text-primary">{group.shippingProvider || 'ثبت نشده'}</span>
                              </div>
                              <div className="text-left dir-ltr">
                                <span className="text-muted">کد رهگیری: </span>
                                <span className="font-mono font-bold text-emerald-600">{group.trackingCode || 'ندارد'}</span>
                              </div>
                            </div>
                            {group.shippingLabelUrl && (
                              <div className="mt-2 pt-2 border-t border-subtle/50 text-left">
                                <a href={group.shippingLabelUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold inline-flex items-center gap-1">
                                  مشاهده رسید ارسال
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-muted">کد رهگیری مرسوله:</span>
                        <span className="font-mono font-bold text-primary-hover">
                          {selectedOrderForDetails.trackingCode || "در انتظار ارسال و صدور بارنامه"}
                        </span>
                      </div>
                    )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/store-manager/StoreOrders.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target not found!");
}
