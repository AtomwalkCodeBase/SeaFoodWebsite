import { useState } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { GiAnchor, GiFishingBoat } from "react-icons/gi";
import { MdOutlineWaves } from "react-icons/md";
import {
  TbShoppingCartPlus,
  TbClipboardList,
  TbBuildingFactory2,
} from "react-icons/tb";
import { BsBoxSeam } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

// ─── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  // Page bg: light so a black-text navbar above is clearly visible
  pageBg:    "#E4F3F8",
  pageBg2:   "#C6E5EF",

  // Left panel: mid-tone ocean teal (not black/dark)
  panelFrom: "#1A9CB0",
  panelMid:  "#0E7A91",
  panelTo:   "#0A6070",

  aqua:      "#4ECDC4",
  seafoam:   "#7EE8E0",
  white:     "#FFFFFF",

  formBg:    "#FFFFFF",
  text:      "#0D2B3E",
  muted:     "#5A7A8A",
  border:    "#C8DDED",
  inputBg:   "#F4FAFB",

  btn:       "#0E7A91",
  btnHover:  "#0A5E72",
};

// ─── Keyframes ─────────────────────────────────────────────────────────────────
const waveMove = keyframes`
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;
const floatY = keyframes`
  0%,100% { transform: translateY(0) rotate(-3deg); }
  50%      { transform: translateY(-14px) rotate(3deg); }
`;
const bubbleUp = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 0.5; }
  100% { transform: translateY(-160px) scale(0.2); opacity: 0; }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideR = keyframes`
  from { opacity: 0; transform: translateX(-26px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const pulseBadge = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(78,205,196,0.45); }
  50%      { box-shadow: 0 0 0 8px rgba(78,205,196,0); }
`;

// ─── Global ────────────────────────────────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Nunito:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Nunito', sans-serif;
    min-height: 100vh;
    background: ${T.pageBg};
  }
`;

// ─── Page ──────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(145deg, ${T.pageBg} 0%, ${T.pageBg2} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  /* padding-top: 7vh;  */
  padding: 120px 16px;

`;

const Blob = styled.div`
  position: absolute;
  border-radius: 50%;
  background: ${({ $c }) => $c};
  width: ${({ $w }) => $w};
  height: ${({ $w }) => $w};
  top: ${({ $t }) => $t ?? "auto"};
  left: ${({ $l }) => $l ?? "auto"};
  right: ${({ $r }) => $r ?? "auto"};
  bottom: ${({ $b }) => $b ?? "auto"};
  opacity: ${({ $o }) => $o ?? 0.18};
  pointer-events: none;
  filter: blur(60px);
`;

const Bubble = styled.span`
  position: absolute;
  bottom: ${({ $b }) => $b};
  left: ${({ $l }) => $l};
  width: ${({ $s }) => $s};
  height: ${({ $s }) => $s};
  border-radius: 50%;
  background: rgba(14,122,145,${({ $o }) => $o ?? 0.14});
  animation: ${bubbleUp} ${({ $d }) => $d} ease-in infinite;
  animation-delay: ${({ $dl }) => $dl ?? "0s"};
  pointer-events: none;
`;

const WaveStrip = styled.div`
  position: absolute;
  bottom: 0; left: 0;
  width: 200%;
  height: 90px;
  animation: ${waveMove} 8s linear infinite;
  pointer-events: none;
`;

// ─── Card ──────────────────────────────────────────────────────────────────────
const Card = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  width: min(960px, 100%);
  min-height: 560px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow:
    0 32px 80px rgba(10,62,96,0.16),
    0 0 0 1px rgba(78,205,196,0.22);
  animation: ${fadeUp} 0.65s ease both;

  @media (max-width: 720px) {
    flex-direction: column;
    min-height: unset;
  }
`;

// ─── Left Panel ────────────────────────────────────────────────────────────────
const Left = styled.div`
  flex: 1.05;
  background: linear-gradient(150deg, ${T.panelFrom} 0%, ${T.panelMid} 50%, ${T.panelTo} 100%);
  padding: 44px 38px 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  @media (max-width: 720px) {
    padding: 36px 26px 32px;
  }
`;

const FloatBoat = styled.div`
  position: absolute;
  right: 20px; top: 32px;
  font-size: 96px;
  color: rgba(255,255,255,0.08);
  animation: ${floatY} 5s ease-in-out infinite;

  @media (max-width: 720px) { display: none; }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 34px;
  animation: ${slideR} 0.5s ease both 0.1s;
`;
const LogoBadge = styled.div`
  width: 50px; height: 50px;
  border-radius: 14px;
  background: rgba(255,255,255,0.16);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,0.26);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: ${T.white};
  animation: ${pulseBadge} 2.8s ease infinite;
  flex-shrink: 0;
`;
const LogoName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 17px; font-weight: 700;
  color: ${T.white}; line-height: 1.2;
`;
const LogoSub = styled.div`
  font-size: 9.5px; font-weight: 800;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${T.seafoam};
  margin-top: 3px;
`;

const Headline = styled.h1`
  font-family: 'Playfair Display', serif;
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 700;
  color: ${T.white};
  line-height: 1.3;
  margin-bottom: 10px;
  animation: ${slideR} 0.5s ease both 0.2s;

  em {
    font-style: normal;
    color: ${T.seafoam};
  }
`;

const Sub = styled.p`
  font-size: 12.5px;
  color: rgba(255,255,255,0.58);
  line-height: 1.65;
  margin-bottom: 26px;
  animation: ${slideR} 0.5s ease both 0.3s;
`;

const ModulesLabel = styled.p`
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 2.2px;
  text-transform: uppercase;
  color: ${T.seafoam};
  margin-bottom: 11px;
  animation: ${slideR} 0.5s ease both 0.35s;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  animation: ${slideR} 0.5s ease both 0.4s;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 13px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 13px;
  cursor: default;
  transition: all 0.22s ease;

  &:hover {
    background: rgba(78,205,196,0.15);
    border-color: rgba(78,205,196,0.35);
    transform: translateY(-2px);
  }
`;
const ModuleIcon = styled.div`
  width: 33px; height: 33px;
  border-radius: 9px;
  background: rgba(78,205,196,0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: ${T.seafoam};
  flex-shrink: 0;
`;
const ModuleTitle = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  line-height: 1.25;
`;
const ModuleDesc = styled.div`
  font-size: 9.5px;
  color: rgba(255,255,255,0.42);
  margin-top: 2px;
`;

const LeftFooter = styled.div`
  margin-top: auto;
  padding-top: 26px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255,255,255,0.18);
  font-size: 19px;
`;

// ─── Right Panel ───────────────────────────────────────────────────────────────
const Right = styled.form`
  flex: 0.95;
  background: ${T.formBg};
  padding: 52px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: ${fadeUp} 0.65s ease both 0.15s;

  @media (max-width: 720px) {
    padding: 36px 26px 44px;
  }
`;

const Welcome = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: clamp(21px, 2.8vw, 27px);
  font-weight: 700;
  color: ${T.text};
  margin-bottom: 5px;
`;
const WelcomeSub = styled.p`
  font-size: 12.5px;
  color: ${T.muted};
  margin-bottom: 10px;
`;
const AccentBar = styled.div`
  width: 42px; height: 3.5px;
  border-radius: 4px;
  background: linear-gradient(90deg, ${T.btn}, ${T.aqua});
  margin-bottom: 28px;
`;

// ─── Shared field components ────────────────────────────────────────────────────
const FieldWrap = styled.div`
  margin-bottom: 18px;
`;
const FieldLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: ${T.text};
  margin-bottom: 7px;
`;
const InputWrap = styled.div`
  position: relative;
`;
const LeadIcon = styled.span`
  position: absolute;
  left: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: ${({ $on }) => ($on ? T.btn : T.muted)};
  display: flex;
  transition: color 0.2s;
`;
const TrailBtn = styled.button`
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer;
  color: ${T.muted};
  font-size: 15px; display: flex;
  padding: 4px;
  transition: color 0.2s;
  &:hover { color: ${T.btn}; }
`;
const StyledInput = styled.input`
  width: 100%;
  padding: 13px 42px;
  border: 1.5px solid ${({ $on }) => ($on ? T.btn : T.border)};
  border-radius: 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 13.5px;
  color: ${T.text};
  background: ${({ $on }) => ($on ? T.white : T.inputBg)};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-shadow: ${({ $on }) => ($on ? "0 0 0 3px rgba(14,122,145,0.11)" : "none")};

  &::placeholder { color: #9BB8C6; }
  &:hover:not(:focus) { border-color: rgba(14,122,145,0.38); }
`;

const ForgotRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: -6px;
  margin-bottom: 24px;
`;
const ForgotLink = styled.a`
  font-size: 11.5px;
  font-weight: 700;
  color: ${T.btn};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: ${T.btnHover}; }
`;

const SignInBtn = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, ${T.btn}, ${T.btnHover});
  color: ${T.white};
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 800;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.25s ease;
  box-shadow: 0 6px 22px rgba(14,122,145,0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(14,122,145,0.4);
    background: linear-gradient(135deg, #15A0B8, ${T.btn});
  }
  &:active { transform: translateY(0); }
  svg { font-size: 16px; }
`;

const FormFooter = styled.p`
  font-size: 10.5px;
  color: ${T.muted};
  text-align: center;
  margin-top: 22px;
  opacity: 0.65;
`;

// ─── Static data ───────────────────────────────────────────────────────────────
const MODULES = [
  { icon: <TbShoppingCartPlus />, title: "Purchase Management",    desc: "Suppliers & POs"      },
  { icon: <TbClipboardList     />, title: "Order Management",      desc: "Sales & fulfillment"  },
  { icon: <TbBuildingFactory2  />, title: "Production Management", desc: "Processing & batches" },
  { icon: <BsBoxSeam />, title: "Inventory Management",  desc: "Stock & warehousing"  },
];

const BUBBLES = [
  { b: "6%",  l: "5%",  s: "10px", d: "4.2s", dl: "0s",   o: 0.16 },
  { b: "4%",  l: "18%", s: "7px",  d: "3.6s", dl: "1.1s", o: 0.12 },
  { b: "10%", l: "33%", s: "9px",  d: "5s",   dl: "0.4s", o: 0.1  },
  { b: "3%",  l: "55%", s: "12px", d: "6.2s", dl: "1.8s", o: 0.11 },
  { b: "8%",  l: "70%", s: "8px",  d: "4.8s", dl: "0.7s", o: 0.14 },
  { b: "5%",  l: "85%", s: "6px",  d: "3.9s", dl: "2.2s", o: 0.09 },
];

// ─── Reusable input field ──────────────────────────────────────────────────────
function Field({ id, label, type, placeholder, value, onChange, leadIcon, trail, isFocused, onFocus, onBlur }) {
  return (
    <FieldWrap>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputWrap>
        <LeadIcon $on={isFocused}>{leadIcon}</LeadIcon>
        <StyledInput
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          $on={isFocused}
          autoComplete={id === "password" ? "current-password" : "username"}
        />
        {trail}
      </InputWrap>
    </FieldWrap>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────
export default function UserLogin() {
  const { SeaFoodLogin } = useAuth()
  const [formData,  setFormData]  = useState({ userName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focus,   setFocus]   = useState({ userId: false, password: false });
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onFocus  = (k) => setFocus((p)  => ({ ...p, [k]: true  }));
  const onBlur   = (k) => setFocus((p)  => ({ ...p, [k]: false }));

    const handleSubmit = async(e) => {
      e.preventDefault();
      setLoading(true);
      
      console.log('Login attempt:', formData);
  
      try {
        
        if(formData.userName && formData.password){
          const userData = {
            username: formData.userName,
            password: formData.password
          }
          await SeaFoodLogin(userData);
        }
      } catch (error) {
        toast.error("Invalid credentials. Please try again.")
        
      }finally{
        setLoading(false)
      }
    };

  return (
    <>
      <GlobalStyle />
      <Page>
        {/* Background blobs */}
        <Blob $c="rgba(14,122,145,0.17)"  $w="480px" $t="-130px" $l="-100px" />
        <Blob $c="rgba(78,205,196,0.13)"  $w="380px" $b="-80px"  $r="-80px"  />
        <Blob $c="rgba(14,122,145,0.09)"  $w="280px" $t="42%"    $l="62%"    />

        {/* Rising bubbles */}
        {BUBBLES.map((b, i) => (
          <Bubble key={i} $b={b.b} $l={b.l} $s={b.s} $d={b.d} $dl={b.dl} $o={b.o} />
        ))}

        {/* Bottom wave */}
        <WaveStrip>
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" width="100%" height="100%">
            <path fill="rgba(14,122,145,0.1)"
              d="M0,45 C360,0 720,90 1080,45 C1260,22 1380,65 1440,45 L1440,90 L0,90 Z"/>
            <path fill="rgba(78,205,196,0.07)"
              d="M0,65 C240,25 480,85 720,55 C960,30 1200,78 1440,55 L1440,90 L0,90 Z"/>
          </svg>
        </WaveStrip>

        <Card>
          {/* ══ LEFT ══ */}
          <Left>
            <FloatBoat><GiFishingBoat /></FloatBoat>

            <LogoRow>
              <LogoBadge><GiAnchor /></LogoBadge>
              <div>
                <LogoName>Atomwalk SeaFood Industry</LogoName>
                <LogoSub>ERP Platform</LogoSub>
              </div>
            </LogoRow>

            <Headline>
              Seafood Business,<br />
              <em>Fully Managed</em>
            </Headline>

            <Sub>
              End-to-end ERP built for the seafood industry — from procurement to the production floor, all in one platform.
            </Sub>

            <ModulesLabel>Modules you can access</ModulesLabel>

            <ModulesGrid>
              {MODULES.map(({ icon, title, desc }) => (
                <ModuleCard key={title}>
                  <ModuleIcon>{icon}</ModuleIcon>
                  <div>
                    <ModuleTitle>{title}</ModuleTitle>
                    <ModuleDesc>{desc}</ModuleDesc>
                  </div>
                </ModuleCard>
              ))}
            </ModulesGrid>

            <LeftFooter>
              <MdOutlineWaves />
              <GiFishingBoat />
              <MdOutlineWaves />
            </LeftFooter>
          </Left>

          {/* ══ RIGHT ══ */}
          <Right onSubmit={handleSubmit}>
            <Welcome>Welcome Back</Welcome>
            <WelcomeSub>Please sign in your account </WelcomeSub>
            <AccentBar />

            <Field
              id="userName"
              label="User Name"
              type="text"
              placeholder="Enter your user name"
              value={formData.userId}
              onChange={onChange}
              leadIcon={<FiUser />}
              isFocused={focus.userName}
              onFocus={() => onFocus("userName")}
              onBlur={() => onBlur("userName")}
            />

            <Field
              id="password"
              label="Password"
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={onChange}
              leadIcon={<FiLock />}
              trail={
                <TrailBtn type="button" onClick={() => setShowPwd((p) => !p)}>
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </TrailBtn>
              }
              isFocused={focus.password}
              onFocus={() => onFocus("password")}
              onBlur={() => onBlur("password")}
            />

            {/* <ForgotRow>
              <ForgotLink>Forgot Password?</ForgotLink>
            </ForgotRow> */}

            <SignInBtn type="submit">
              Login <FiArrowRight />
            </SignInBtn>

            <FormFooter>© Atomwalk seafood ERP. All rights reserved.</FormFooter>
          </Right>
        </Card>
      </Page>
    </>
  );
}