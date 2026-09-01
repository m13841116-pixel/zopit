const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreOrders.tsx', 'utf8');
const search = `    } finally {
      setPaymentSubmitting(false);
    }
  };

  const getStatusText = (status: string) => {`;
const replace = `    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueText.trim()) return toast('متن مشکل نباید خالی باشد', 'error');
    if (!selectedOrderForDetails) return;
    
    setSubmittingIssue(true);
    try {
      const res = await fetch('/api/store-manager/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\`
        },
        body: JSON.stringify({
          subject: \`گزارش مشکل در سفارش #\${selectedOrderForDetails.id}\`,
          department: 'SUPPORT',
          priority: 'HIGH',
          message: issueText
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast('مشکل شما با موفقیت ثبت شد و توسط تیم پشتیبانی بررسی خواهد شد.', 'success');
        setShowReportIssue(false);
        setIssueText("");
      } else {
        toast(data.error || 'خطا در ثبت مشکل', 'error');
      }
    } catch(e) {
      toast('خطای شبکه', 'error');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const getStatusText = (status: string) => {`;
code = code.replace(search, replace);
fs.writeFileSync('src/components/store-manager/StoreOrders.tsx', code);
