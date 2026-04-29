import { useEffect, useState } from "react"
import { FaUser, FaLock, FaBuilding, FaSyncAlt, FaShieldAlt, FaUsers, FaChartLine, FaChevronDown } from "react-icons/fa"
import { VscEye, VscEyeClosed } from "react-icons/vsc"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import { forgetUserPinView, getCompanyName } from "../services/productServices"
import { useNavigate } from "react-router-dom"
import { IoBarChartSharp, IoTicketOutline } from "react-icons/io5"
import { LuClipboardList } from "react-icons/lu"
import { MdOutlineTimer } from "react-icons/md"

/* ─── Inline keyframe styles (minimal, no styled-components) ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
 
  * { font-family: 'DM Sans', sans-serif; }
 
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeLeft {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes bubbleRise {
    0%   { opacity: 0; transform: translateY(0) scale(0.6); }
    50%  { opacity: 0.6; }
    100% { opacity: 0; transform: translateY(-80px) scale(1); }
  }
  @keyframes waveAnim {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
 
  .anim-fade-up   { animation: fadeUp 0.7s ease-out both; }
  .anim-fade-up-d { animation: fadeUp 0.7s ease-out 0.18s both; }
  .anim-fade-left { animation: fadeLeft 0.8s ease-out 0.1s both; }
 
  .brand-title {
    font-family: 'Playfair Display', serif;
    background: linear-gradient(120deg, #e0f7f4 0%, #7fe8d8 40%, #ffffff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .form-heading { font-family: 'Playfair Display', serif; }
 
  .bubble {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.18);
    animation: bubbleRise 4s ease-in infinite;
  }
 
  .wave-svg {
    animation: waveAnim 8s linear infinite;
    width: 200%;
  }
 
  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(10,123,142,0.45);
  }
  .refresh-btn:hover { transform: rotate(180deg); }
`

/* ─── Bubble decoration ─── */
const Bubbles = () => (
  <>
    {[
      { size: "w-2 h-2",   left: "left-[12%]", delay: "delay-[0s]",    dur: "[3.5s]" },
      { size: "w-3.5 h-3.5", left: "left-[28%]", delay: "delay-[1.2s]", dur: "[4.8s]" },
      { size: "w-1.5 h-1.5", left: "left-[55%]", delay: "delay-[0.6s]", dur: "[3s]"   },
      { size: "w-2.5 h-2.5", left: "left-[72%]", delay: "delay-[2s]",   dur: "[5s]"   },
      { size: "w-1 h-1",   left: "left-[88%]", delay: "delay-[0.3s]", dur: "[4s]"   },
    ].map((b, i) => (
      <div
        key={i}
        className={`bubble ${b.size} ${b.left} bottom-[10%] animate-[bubbleRise_${b.dur}_ease-in_infinite] ${b.delay}`}
      />
    ))}
  </>
)

/* ─── Ocean SVG wave ─── */
const OceanWave = () => (
  <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none">
    <svg className="wave-svg h-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
      <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill="rgba(255,255,255,0.07)" />
      <path d="M0,45 C150,20 350,55 600,40 C850,25 1050,50 1200,35 L1200,60 L0,60 Z" fill="rgba(255,255,255,0.05)" />
    </svg>
  </div>
)

/* ─── Feature chip component ─── */
const Chip = ({ icon, label }) => (
  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/20 bg-white/[0.14] hover:bg-white/[0.22] hover:translate-x-1 transition-all duration-200">
    <span className="text-[#7fe8d8] text-base shrink-0">{icon}</span>
    <span className="text-white/90 text-xs font-medium">{label}</span>
  </div>
)

const inputCls = "w-full pl-9 pr-3 py-2 border-[1.5px] border-[#c8dde8] rounded-[10px] text-sm bg-[#f4fafb] text-[#0d2b3e] focus:border-[#0a7b8e] focus:ring-2 focus:ring-[#0a7b8e]/20 focus:outline-none transition-all placeholder:text-[#8aacba]"
const labelCls = "block text-[0.75rem] font-semibold text-[#1a4a5e] mb-1 uppercase tracking-wide"
 
const EmpLogin = () => {
  const [formData, setFormData] = useState({ mobile: "", password: "", company: "", captcha: "" })
  const [loading, setLoading]   = useState(false)
  const [companies, setCompanies] = useState([])
  const [placeholderdatas]       = useState("Employee ID / Mobile Number")
  const [loginData, setLoginData] = useState(true)
  const [captchaText, setCaptchaText] = useState("")
  const { login, error } = useAuth()
  const navigation = useNavigate()
  const [passShow, setPassShow] = useState(false)

  const generateCaptcha = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  }

  useEffect(() => {
    const fetchCompanyName = async () => {
      const company = await getCompanyName()
      if (company.status === 200) setCompanies(company.data)
    }
    fetchCompanyName()
    setCaptchaText(generateCaptcha())
    if (localStorage.getItem("userToken")) {
      if (localStorage.getItem("seaUser"))  navigation("/seaFood/home")
    }
  }, [])

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha())
    setFormData(prev => ({ ...prev, captcha: "" }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "mobile" && value.length > 12) return
    if (name === "password" && (value.length > 6 || !/^\d*$/.test(value))) return
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCompanyChange = (e) => {
    setFormData(prev => ({ ...prev, company: e.target.value }))
    localStorage.setItem("dbName", e.target.value.split("_").slice(1).join("_"))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(async () => {
      if (formData.mobile && formData.password) {
        const userData = {
          id: "1", name: "Ashutosh Mohapatra",
          mobile: formData.mobile, password: formData.password,
          role: "HR Manager",
          company: formData?.company?.split("_").slice(1).join("_") || "Acme Inc.",
        }
        await login(userData)
      } else {
        toast.error("Invalid credentials. Please try again.")
      }
      setLoading(false)
      refreshCaptcha()
    }, 500)
  }

  const handleForgotPass = async (e) => {
    e.preventDefault()
    if (formData.captcha !== captchaText) {
      toast.error("Invalid captcha. Please try again.")
      refreshCaptcha()
      return
    }
    setLoading(true)
    const isMobileNumber = /^\d{10}$/.test(formData.mobile)
    const dbName = formData?.company?.split("_").slice(1).join("_") || "Acme Inc."
    const userData = isMobileNumber
      ? { mobile_number: formData.mobile, dbName }
      : { emp_id: formData.mobile, dbName }
    const response = await forgetUserPinView(userData, dbName)
    if (response.status === 200) {
      toast.success("Pin sent to your registered E-mail Address.")
      setLoginData(true)
    } else {
      toast.error("Failed to send pin. Please try again.")
    }
    setLoading(false)
    refreshCaptcha()
  }

  return (
    <>
      <style>{globalStyles}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #071e2e 0%, #0d3a52 35%, #0a6070 70%, #0f8080 100%)" }}>
 
        {/* Decorative blobs */}
        <div className="absolute -top-[10%] -left-[8%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(10,123,142,0.35) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-[12%] -right-[6%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,128,128,0.3) 0%, transparent 70%)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
 
        {/* ── Card ── */}
        <div className="anim-fade-up w-full max-w-[880px] grid grid-cols-1 md:grid-cols-2 rounded-[22px] overflow-hidden"
          style={{ boxShadow: "0 30px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)" }}>
 
          {/* ══ LEFT: Brand panel ══ */}
          <div className="relative flex flex-col justify-center items-start p-8 md:p-10 overflow-hidden min-h-[380px] md:min-h-[500px]"
            style={{ background: "linear-gradient(160deg, #0a3d52 0%, #0a6b7a 60%, #0d8585 100%)" }}>
 
            <Bubbles />
            <OceanWave />
 
            {/* Logo + title */}
            <div className="anim-fade-left relative z-10 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 border border-white/25 bg-white/10">
                🐟
              </div>
              <h1 className="brand-title text-2xl md:text-4xl leading-tight mb-1">
                ATOMWALK SEAFOOD INDUSTRY
              </h1>
              <p className="text-white/60 text-[0.72rem] tracking-widest uppercase font-light">
               Seafood Export Management
              </p>
            </div>
 
            {/* Accent line */}
            <div className="w-10 h-0.5 rounded-full mb-5 relative z-10" style={{ background: "rgba(127,232,216,0.5)" }} />
 
            {/* Chips */}
            <div className="anim-fade-left flex flex-col gap-2.5 w-full relative z-10">
                <>
                  <Chip icon={<FaUsers />}     label="Employee Management" />
                  <Chip icon={<FaShieldAlt />} label="Secure & Reliable Platform" />
                  <Chip icon={<FaChartLine />} label="Analytics & Reports" />
                </>
            </div>
 
            {/* Footer text */}
            <p className="text-white/25 text-[0.65rem] mt-auto pt-8 relative z-10">
              © {new Date().getFullYear()} Atomwalk Technologies · Seafood Export Division
            </p>
          </div>
 
          {/* ══ RIGHT: Form panel ══ */}
          <div className="bg-white flex flex-col justify-center p-8 md:p-10">
            <div className="anim-fade-up-d w-full max-w-[340px] mx-auto">
 
              {/* Header */}
              <div className="mb-6">
                <span className="inline-flex items-center bg-[#e8f8f8] border border-[#b0e0e8] rounded-full px-3 py-1 text-[0.65rem] font-semibold text-[#0a7b8e] tracking-widest uppercase mb-2">
                  {loginData ? "Employee Portal" : "Reset PIN"}
                </span>
                <h2 className="form-heading text-2xl md:text-3xl font-bold text-[#071e2e] mb-1">
                  {loginData ? "Welcome Back" : "Forgot Your PIN?"}
                </h2>
                <p className="text-[#5a7a8a] text-xs">
                  {loginData ? "Sign in to continue to your dashboard." : "Enter your details to receive a new PIN."}
                </p>
              </div>
 
              {/* Form */}
              <form onSubmit={loginData ? handleSubmit : handleForgotPass} className="flex flex-col gap-4">
 
                {/* Company */}
                <div>
                  <label htmlFor="company" className={labelCls}>Company</label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a7b8e] text-xs pointer-events-none" />
                    <select
                      id="company" name="company"
                      value={formData.company}
                      onChange={handleCompanyChange}
                      required
                      className={`${inputCls} appearance-none cursor-pointer pr-8`}
                    >
                      <option value="" disabled>Select your company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.name}>{c.ref_cust_name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7a8a] text-[10px] pointer-events-none" />
                  </div>
                </div>
 
                {/* Employee ID / Mobile */}
                <div>
                  <label htmlFor="mobile" className={labelCls}>{placeholderdatas}</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a7b8e] text-xs pointer-events-none" />
                    <input
                      type="text" id="mobile" name="mobile"
                      placeholder="Enter employee ID or mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      maxLength={12}
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
 
                {/* PIN */}
                {loginData && (
                  <div>
                    <label htmlFor="password" className={labelCls}>PIN</label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a7b8e] text-xs pointer-events-none" />
                      <input
                        type={passShow ? "text" : "password"}
                        id="password" name="password"
                        placeholder="Enter your 6-digit PIN"
                        value={formData.password}
                        onChange={handleChange}
                        maxLength={6}
                        required
                        className={`${inputCls} pr-10`}
                      />
                      {formData.password && (
                        <button
                          type="button"
                          onClick={() => setPassShow(!passShow)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a7a8a] text-base bg-transparent border-none cursor-pointer"
                        >
                          {passShow ? <VscEyeClosed /> : <VscEye />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
 
                {/* Captcha */}
                <div>
                  <label className={labelCls}>Security Code</label>
                  <div className="flex gap-2 items-center">
                    {/* Display */}
                    <div className="shrink-0 rounded-[10px] px-3 py-1.5 border-[1.5px] border-[#b0d8e0] text-base font-bold font-mono tracking-[3px] text-[#0a4b5e] min-w-[88px] text-center select-none"
                      style={{ background: "linear-gradient(135deg, #e8f8f8, #d0eff5)" }}>
                      {captchaText}
                    </div>
                    {/* Refresh */}
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="refresh-btn shrink-0 w-9 h-9 bg-[#0a7b8e] hover:bg-[#0a4b5e] text-white rounded-[10px] flex items-center justify-center text-xs border-none cursor-pointer transition-all duration-300"
                    >
                      <FaSyncAlt />
                    </button>
                    {/* Input */}
                    <input
                      type="text" name="captcha"
                      placeholder="Enter code"
                      value={formData.captcha}
                      onChange={handleChange}
                      className="flex-1 min-w-0 py-2 px-3 border-[1.5px] border-[#c8dde8] rounded-[10px] text-sm bg-[#f4fafb] text-[#0d2b3e] focus:border-[#0a7b8e] focus:ring-2 focus:ring-[#0a7b8e]/20 focus:outline-none transition-all placeholder:text-[#8aacba]"
                    />
                  </div>
                </div>
 
                {/* Error */}
                {error && (
                  <p className="text-[#c0392b] text-xs px-3 py-2 bg-[#fdf2f2] rounded-lg border-l-[3px] border-[#e74c3c]">
                    {error}
                  </p>
                )}
 
                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn w-full py-2.5 text-white rounded-xl text-sm font-semibold tracking-wide border-none cursor-pointer transition-all duration-200 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #0a7b8e 0%, #0e4f72 100%)" }}
                >
                  {loading
                    ? (loginData ? "Signing in…" : "Submitting…")
                    : (loginData ? "Sign In →" : "Send Reset PIN →")}
                </button>
 
                {/* Forgot / back */}
                <div className="text-center mt-1">
                  <button
                    type="button"
                    onClick={() => setLoginData(!loginData)}
                    className="text-[#0a7b8e] hover:text-[#0e4f72] text-xs font-medium bg-transparent border-none cursor-pointer underline-offset-2 hover:underline transition-colors"
                  >
                    {loginData ? "Forgot PIN?" : "← Back to Sign In"}
                  </button>
                </div>
 
              </form>
 
            </div>
          </div>
 
        </div>
      </div>
    </>
  )
}

export default EmpLogin