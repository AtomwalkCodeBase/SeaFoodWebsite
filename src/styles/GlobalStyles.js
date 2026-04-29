import { createGlobalStyle } from "styled-components"

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts?.body || "'Poppins', sans-serif"};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    transition: all 0.3s ease;
    font-size: ${({ theme }) => theme.fontSizes?.md || "1rem"};
    font-weight: ${({ theme }) => theme.fontWeights?.body || "400"};
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.fontWeights?.heading || "600"};
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.primary};
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.primary};
    transition: color 0.3s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.secondary};
    }
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    transition: ${({ theme }) => theme.transitions?.normal || "all 0.3s ease"};
    border-radius: ${({ theme }) => theme.buttons?.borderRadius || "8px"};
  }

  input, select, textarea {
    font-family: ${({ theme }) => theme.fonts?.body || "'Poppins', sans-serif"};
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
      outline: none;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    
    th, td {
      padding: ${({ theme }) => theme.spacing?.md || "12px 15px"};
      text-align: left;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
      color: ${({ theme }) => theme.colors.textLight};
    }
    
    th {
      background-color: ${({ theme }) => theme.colors.primaryLight};
      color: ${({ theme }) => theme.colors.textLight};
      font-weight: 600;
    }
    
    tr:hover {
      background-color: ${({ theme }) => theme.colors.backgroundAlt};
    }
  }

  .card {
    background: ${({ theme }) => theme.colors.card};
    border-radius: ${({ theme }) => theme.borderRadius?.lg || "8px"};
    box-shadow: ${({ theme }) => theme.shadows?.md || "0 4px 6px rgba(0, 0, 0, 0.1)"};
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: ${({ theme }) => theme.transitions?.normal || "transform 0.3s ease, box-shadow 0.3s ease"};
    
    &:hover {
      transform: ${({ theme }) => (theme.cardStyle?.animation ? "translateY(-5px)" : "none")};
      box-shadow: ${({ theme }) =>
    theme.cardStyle?.animation
      ? "0 10px 15px rgba(0, 0, 0, 0.1)"
      : theme.shadows?.md || "0 4px 6px rgba(0, 0, 0, 0.1)"};
    }
    
    @media (max-width: 768px) {
      padding: 1rem;
      margin-bottom: 1rem;
      
      &:hover {
        transform: none;
      }
    }
  }

  .container {
    max-width: ${({ theme }) =>
    theme.layout?.containerWidth === "narrow"
      ? "800px"
      : theme.layout?.containerWidth === "wide"
        ? "1400px"
        : "1200px"};
    margin: 0 auto;
    padding: 0 1rem;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .grid {
    display: grid;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  .gap-4 {
    gap: ${({ theme }) => theme.spacing?.md || "1rem"};
  }

    /* Padding - All sides */
  .p-0 { padding: 0; }
  .p-1 { padding: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .p-2 { padding: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .p-3 { padding: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .p-4 { padding: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .p-5 { padding: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .p-6 { padding: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .p-7 { padding: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Horizontal (left & right) */
  .px-0 { padding-left: 0; padding-right: 0; }
  .px-1 { padding-left: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; padding-right: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .px-2 { padding-left: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; padding-right: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .px-3 { padding-left: ${({ theme }) => theme.spacing?.md || "1rem"}; padding-right: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .px-4 { padding-left: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; padding-right: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .px-5 { padding-left: ${({ theme }) => theme.spacing?.xl || "2rem"}; padding-right: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .px-6 { padding-left: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; padding-right: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .px-7 { padding-left: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; padding-right: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Vertical (top & bottom) */
  .py-0 { padding-top: 0; padding-bottom: 0; }
  .py-1 { padding-top: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; padding-bottom: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .py-2 { padding-top: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; padding-bottom: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .py-3 { padding-top: ${({ theme }) => theme.spacing?.md || "1rem"}; padding-bottom: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .py-4 { padding-top: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; padding-bottom: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .py-5 { padding-top: ${({ theme }) => theme.spacing?.xl || "2rem"}; padding-bottom: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .py-6 { padding-top: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; padding-bottom: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .py-7 { padding-top: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; padding-bottom: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Top */
  .pt-0 { padding-top: 0; }
  .pt-1 { padding-top: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .pt-2 { padding-top: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .pt-3 { padding-top: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .pt-4 { padding-top: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .pt-5 { padding-top: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .pt-6 { padding-top: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .pt-7 { padding-top: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Right */
  .pr-0 { padding-right: 0; }
  .pr-1 { padding-right: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .pr-2 { padding-right: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .pr-3 { padding-right: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .pr-4 { padding-right: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .pr-5 { padding-right: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .pr-6 { padding-right: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .pr-7 { padding-right: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Bottom */
  .pb-0 { padding-bottom: 0; }
  .pb-1 { padding-bottom: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .pb-2 { padding-bottom: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .pb-3 { padding-bottom: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .pb-4 { padding-bottom: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .pb-5 { padding-bottom: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .pb-6 { padding-bottom: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .pb-7 { padding-bottom: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Padding - Left */
  .pl-0 { padding-left: 0; }
  .pl-1 { padding-left: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .pl-2 { padding-left: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .pl-3 { padding-left: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .pl-4 { padding-left: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .pl-5 { padding-left: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .pl-6 { padding-left: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .pl-7 { padding-left: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Font Sizes */
  .text-0 { font-size: 0; }
  .text-1 { font-size: ${({ theme }) => theme.fontSizes?.xs || "0.75rem"}; }
  .text-2 { font-size: ${({ theme }) => theme.fontSizes?.sm || "0.875rem"}; }
  .text-3 { font-size: ${({ theme }) => theme.fontSizes?.md || "1rem"}; }
  .text-4 { font-size: ${({ theme }) => theme.fontSizes?.lg || "1.125rem"}; }
  .text-5 { font-size: ${({ theme }) => theme.fontSizes?.xl || "1.25rem"}; }
  .text-6 { font-size: ${({ theme }) => theme.fontSizes?.["2xl"] || "1.5rem"}; }
  .text-7 { font-size: ${({ theme }) => theme.fontSizes?.["3xl"] || "1.875rem"}; }
  .text-8 { font-size: ${({ theme }) => theme.fontSizes?.["4xl"] || "2.25rem"}; }
  .text-9 { font-size: ${({ theme }) => theme.fontSizes?.["5xl"] || "3rem"}; }

  /* Border Radius */
  .rounded-0 { border-radius: 0; }
  .rounded-1 { border-radius: ${({ theme }) => theme.borderRadius?.sm || "0.125rem"}; }
  .rounded-2 { border-radius: ${({ theme }) => theme.borderRadius?.md || "0.25rem"}; }
  .rounded-3 { border-radius: ${({ theme }) => theme.borderRadius?.lg || "0.5rem"}; }
  .rounded-4 { border-radius: ${({ theme }) => theme.borderRadius?.xl || "1rem"}; }
  .rounded-5 { border-radius: ${({ theme }) => theme.borderRadius?.full || "9999px"}; }

  /* Margin - All sides */
  .m-0 { margin: 0; }
  .m-1 { margin: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .m-2 { margin: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .m-3 { margin: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .m-4 { margin: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .m-5 { margin: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .m-6 { margin: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .m-7 { margin: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Horizontal (left & right) */
  .mx-0 { margin-left: 0; margin-right: 0; }
  .mx-1 { margin-left: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; margin-right: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .mx-2 { margin-left: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; margin-right: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .mx-3 { margin-left: ${({ theme }) => theme.spacing?.md || "1rem"}; margin-right: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .mx-4 { margin-left: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; margin-right: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .mx-5 { margin-left: ${({ theme }) => theme.spacing?.xl || "2rem"}; margin-right: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .mx-6 { margin-left: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; margin-right: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .mx-7 { margin-left: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; margin-right: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Vertical (top & bottom) */
  .my-0 { margin-top: 0; margin-bottom: 0; }
  .my-1 { margin-top: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; margin-bottom: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .my-2 { margin-top: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; margin-bottom: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .my-3 { margin-top: ${({ theme }) => theme.spacing?.md || "1rem"}; margin-bottom: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .my-4 { margin-top: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; margin-bottom: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .my-5 { margin-top: ${({ theme }) => theme.spacing?.xl || "2rem"}; margin-bottom: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .my-6 { margin-top: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; margin-bottom: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .my-7 { margin-top: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; margin-bottom: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Top */
  .mt-0 { margin-top: 0; }
  .mt-1 { margin-top: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .mt-2 { margin-top: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .mt-3 { margin-top: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .mt-4 { margin-top: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .mt-5 { margin-top: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .mt-6 { margin-top: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .mt-7 { margin-top: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Right */
  .mr-0 { margin-right: 0; }
  .mr-1 { margin-right: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .mr-2 { margin-right: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .mr-3 { margin-right: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .mr-4 { margin-right: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .mr-5 { margin-right: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .mr-6 { margin-right: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .mr-7 { margin-right: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Bottom */
  .mb-0 { margin-bottom: 0; }
  .mb-1 { margin-bottom: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .mb-2 { margin-bottom: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .mb-3 { margin-bottom: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .mb-4 { margin-bottom: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .mb-5 { margin-bottom: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .mb-6 { margin-bottom: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .mb-7 { margin-bottom: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  /* Margin - Left */
  .ml-0 { margin-left: 0; }
  .ml-1 { margin-left: ${({ theme }) => theme.spacing?.xs || "0.25rem"}; }
  .ml-2 { margin-left: ${({ theme }) => theme.spacing?.sm || "0.5rem"}; }
  .ml-3 { margin-left: ${({ theme }) => theme.spacing?.md || "1rem"}; }
  .ml-4 { margin-left: ${({ theme }) => theme.spacing?.lg || "1.5rem"}; }
  .ml-5 { margin-left: ${({ theme }) => theme.spacing?.xl || "2rem"}; }
  .ml-6 { margin-left: ${({ theme }) => theme.spacing?.["2xl"] || "3rem"}; }
  .ml-7 { margin-left: ${({ theme }) => theme.spacing?.["3xl"] || "4rem"}; }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .rounded {
    border-radius: ${({ theme }) => theme.borderRadius?.md || "4px"};
  }

  .shadow {
    box-shadow: ${({ theme }) => theme.shadows?.md || "0 4px 6px rgba(0, 0, 0, 0.1)"};
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease forwards;
  }

  .responsive-table {
    overflow-x: auto;
    width: 100%;
  }

  .responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: ${({ theme }) => theme.spacing?.md || "1rem"};
  }

  @media (max-width: 768px) {
    .grid-cols-2, .grid-cols-3, .grid-cols-4 {
      grid-template-columns: 1fr;
    }
    
    .responsive-grid {
      grid-template-columns: 1fr;
    }
    
    .hide-on-mobile {
      display: none;
    }
    
    .p-4 {
      padding: 0.75rem;
    }
    
    .m-4 {
      margin: 0.75rem;
    }
    
    h1 {
      font-size: 1.5rem;
    }
    
    h2 {
      font-size: 1.3rem;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .grid-cols-3, .grid-cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Layout density styles */
  ${({ theme }) =>
    theme.layout?.density === "compact" &&
    `
    .card, .p-4 {
      padding: 0.75rem;
    }
    
    .gap-4 {
      gap: 0.75rem;
    }
    
    table th, table td {
      padding: 8px 12px;
    }
    
    .mb-4, .mt-4, .m-4 {
      margin: 0.75rem;
    }
  `}

  ${({ theme }) =>
    theme.layout?.density === "spacious" &&
    `
    .card, .p-4 {
      padding: 2rem;
    }
    
    .gap-4 {
      gap: 1.5rem;
    }
    
    table th, table td {
      padding: 16px 20px;
    }
    
    .mb-4, .mt-4, .m-4 {
      margin: 1.5rem;
    }
  `}

  /* Icon size styles */
  ${({ theme }) =>
    theme.icons?.size === "small" &&
    `
    .icon, svg {
      font-size: 0.85em;
    }
  `}

  ${({ theme }) =>
    theme.icons?.size === "large" &&
    `
    .icon, svg {
      font-size: 1.25em;
    }
  `}

  /* Button styles */
  button, .btn {
    border-radius: ${({ theme }) =>
    theme.buttons?.borderRadius === "0" ? "0" : theme.buttons?.borderRadius === "9999px" ? "9999px" : "8px"};
    
    box-shadow: ${({ theme }) => (theme.buttons?.shadow ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none")};
    
    &:hover {
      transform: ${({ theme }) => (theme.buttons?.animation ? "translateY(-2px)" : "none")};
      
      box-shadow: ${({ theme }) =>
    theme.buttons?.shadow && theme.buttons?.animation
      ? "0 6px 8px rgba(0, 0, 0, 0.15)"
      : theme.buttons?.shadow
        ? "0 4px 6px rgba(0, 0, 0, 0.1)"
        : "none"};
    }
  }
`
