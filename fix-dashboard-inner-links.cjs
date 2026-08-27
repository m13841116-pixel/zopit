const fs = require('fs');

const file = 'src/components/store-manager/StoreManagerDashboard.tsx';
let content = fs.readFileSync(file, 'utf-8');

const fix3 = `                              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 transition-colors group-hover:bg-warning group-hover:text-white">
                                <Wallet className="w-6 h-6" />
                              </Link>
                              <div>
                                <h4 className="font-bold text-primary text-sm">
                                  صورت‌حساب‌ها
                                </h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                  پرداخت فاکتورها و تسویه با پلتفرم
                                </p>
                              </div>
                            </div>`;
const replace3 = `                              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 transition-colors group-hover:bg-warning group-hover:text-white">
                                <Wallet className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-primary text-sm">
                                  صورت‌حساب‌ها
                                </h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                  پرداخت فاکتورها و تسویه با پلتفرم
                                </p>
                              </div>
                            </Link>`;

content = content.replace(fix3, replace3);
fs.writeFileSync(file, content);
