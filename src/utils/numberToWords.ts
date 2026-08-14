const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const classes = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];
const ten_to_twenty = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];

export function numberToWords(number: number | string): string {
    if (number === undefined || number === null) return '';
    let engStr = number.toString()
        .replace(/[,،٬\s]/g, '')
        .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 0x06f0).toString())
        .replace(/[٠-٩]/g, (d: string) => (d.charCodeAt(0) - 0x0660).toString());
        
    if (engStr === '0' || engStr === '') return 'صفر';
    
    let str = engStr;
    let parts = [];
    
    // Split into groups of 3
    let groups = [];
    while (str.length > 0) {
        groups.push(str.slice(-3));
        str = str.slice(0, -3);
    }
    
    for (let i = 0; i < groups.length; i++) {
        let group = parseInt(groups[i], 10);
        if (group === 0) continue;
        
        let h = Math.floor(group / 100);
        let t = Math.floor((group % 100) / 10);
        let o = group % 10;
        
        let groupWords = [];
        
        if (h > 0) groupWords.push(hundreds[h]);
        
        if (t === 1) {
            groupWords.push(ten_to_twenty[o]);
        } else {
            if (t > 1) groupWords.push(tens[t]);
            if (o > 0) groupWords.push(ones[o]);
        }
        
        let groupStr = groupWords.join(' و ');
        if (classes[i]) groupStr += ' ' + classes[i];
        
        parts.unshift(groupStr);
    }
    
    return parts.join(' و ');
}
