import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const [loading, setLoading] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const currentPlan = user?.subscription?.plan || 'free';

  const plans = [
    { id:'free',   name:'Free',   price:'₹0',     period:'',       questions:'1/day',         color:'#64748b', accent:'rgba(100,116,139,0.2)', features:[t('planFree1'),t('planFree2'),t('planFree3'),t('planFree4')] },
    { id:'bronze', name:'Bronze', price:'₹100',   period:'/mo',    questions:'5/day',         color:'#fb923c', accent:'rgba(251,146,60,0.15)', features:[t('planBronze1'),t('planBronze2'),t('planBronze3'),t('planBronze4')] },
    { id:'silver', name:'Silver', price:'₹300',   period:'/mo',    questions:'10/day',        color:'#94a3b8', accent:'rgba(148,163,184,0.15)', features:[t('planSilver1'),t('planSilver2'),t('planSilver3'),t('planSilver4')] },
    { id:'gold',   name:'Gold',   price:'₹1,000', period:'/mo',    questions:'Unlimited',     color:'#fbbf24', accent:'rgba(251,191,36,0.15)', features:[t('planGold1'),t('planGold2'),t('planGold3'),t('planGold4')], popular:true },
  ];

  const handleSubscribe = async (planId) => {
    if (!user) return navigate('/login');
    if (planId === 'free') return;
    setLoading(planId); setError(''); setSuccess('');
    try {
      const orderRes = await api.post('/payment/create-order', { plan: planId });
      const { orderId, amount, currency, keyId, demo, paymentId } = orderRes.data;
      if (demo) {
        const vRes = await api.post('/payment/verify', {
          razorpayOrderId: orderId, razorpayPaymentId: 'demo_pay_' + Date.now(), paymentId, demo: true
        });
        updateUser({ subscription: { ...user.subscription, plan: planId } });
        setSuccess(`🎉 ${vRes.data.message}`);
        return;
      }
      const options = {
        key: keyId, amount, currency, name: 'BrainLink',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} ${t('subscription')}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const vRes = await api.post('/payment/verify', {
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature, paymentId
            });
            updateUser({ subscription: { ...user.subscription, plan: planId } });
            setSuccess(`🎉 ${vRes.data.message}`);
          } catch { setError(t('paymentVerifyFailed')); }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6366f1' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { setError(err.response?.data?.message || t('paymentFailed')); }
    finally { setLoading(''); }
  };

  return (
    <div className="container">
      <h1 className="page-title">💎 {t('subscription')}</h1>

      {/* Current plan status */}
      <div className="card" style={{ marginBottom: 28, display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:16,
        background:'linear-gradient(135deg, var(--surface), var(--surface-2))' }}>
        <div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:8 }}>{t('currentPlanLabel')}</div>
          <span className={`badge badge-${currentPlan}`}
            style={{ fontSize:'0.9rem', padding:'5px 18px', textTransform:'capitalize' }}>
            {currentPlan}
          </span>
          {user?.subscription?.expiresAt && (
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6 }}>
              {t('expires')}: {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:4 }}>{t('questionsToday')}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'2rem', fontWeight:800,
            background:'linear-gradient(135deg,#818cf8,#22d3ee)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            {user?.subscription?.questionsPostedToday || 0}
          </div>
        </div>
      </div>

      <div className="alert alert-warning">{t('paymentWindowNotice')}</div>
      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-danger">⚠️ {error}</div>}

      {/* Plan cards */}
      <div className="plans-grid" style={{ marginTop:28 }}>
        {plans.map((plan, i) => (
          <div key={plan.id} className={`plan-card${currentPlan===plan.id?' active':''}`}
            style={{
              borderColor: currentPlan===plan.id ? plan.color : undefined,
              background: currentPlan===plan.id
                ? `linear-gradient(160deg, var(--surface-2), ${plan.accent})`
                : plan.popular && currentPlan!==plan.id
                  ? 'linear-gradient(160deg, var(--surface), rgba(251,191,36,0.04))'
                  : undefined,
              animation: `fadeUp 0.5s ${i*0.07}s both`,
              position:'relative'
            }}>
            {plan.popular && (
              <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)',
                background:`linear-gradient(135deg,${plan.color},#f59e0b)`,
                color:'#000', fontSize:'0.65rem', fontWeight:800,
                padding:'3px 14px', borderRadius:'0 0 10px 10px',
                letterSpacing:'0.08em', textTransform:'uppercase' }}>
                Most Popular
              </div>
            )}
            <div className="plan-name" style={{ color:plan.color, marginTop: plan.popular?16:0 }}>{plan.name}</div>
            <div className="plan-price" style={{ color:plan.color }}>
              {plan.price}
              <span style={{ fontSize:'0.9rem', fontWeight:400, color:'var(--text-muted)' }}>{plan.period}</span>
            </div>
            <div style={{ fontSize:'0.845rem', color:'var(--accent)', fontWeight:700, margin:'10px 0',
              padding:'5px 12px', background:'rgba(34,211,238,0.08)',
              borderRadius:999, display:'inline-block', border:'1px solid rgba(34,211,238,0.2)' }}>
              📝 {plan.questions}
            </div>
            <ul className="plan-features">
              {plan.features.map((f,j) => (
                <li key={j} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 0',
                  color:'var(--text-2)', fontSize:'0.82rem' }}>
                  <span style={{ color:plan.color, flexShrink:0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {currentPlan===plan.id ? (
              <div className="btn" style={{ width:'100%', background:`linear-gradient(135deg,${plan.color}22,${plan.color}11)`,
                color:plan.color, border:`1px solid ${plan.color}44`, cursor:'default' }}>
                {t('currentPlanBtn')}
              </div>
            ) : plan.id==='free' ? (
              <div className="btn btn-outline" style={{ width:'100%', cursor:'default', opacity:0.5 }}>Free</div>
            ) : (
              <button className="btn btn-primary" style={{ width:'100%', background:`linear-gradient(135deg,${plan.color},${plan.color}cc)`, border:'none' }}
                onClick={() => handleSubscribe(plan.id)} disabled={loading===plan.id}>
                {loading===plan.id ? <><span className="spinner"></span> {t('processing')}</> : t('subscribe')}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop:36 }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, marginBottom:16 }}>{t('howItWorks')}</h3>
        <ul style={{ color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:2.2, paddingLeft:20 }}>
          {[t('subInfo1'),t('subInfo2'),t('subInfo3'),t('subInfo4'),t('subInfo5')].map((info,i) => (
            <li key={i} style={{ color:'var(--text-2)' }}>
              <span style={{ color:'var(--primary)', marginRight:8 }}>›</span>{info}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Subscription;
