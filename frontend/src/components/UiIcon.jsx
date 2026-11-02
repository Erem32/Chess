const paths = {
  back: <path d="M15 18l-6-6 6-6M9 12h11" />,
  arrow: <path d="M9 18l6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  board: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16M12 4v16M8 4v16M16 4v16M4 8h16M4 16h16" /></>,
  spark: <path d="M12 3l1.8 5.7L20 11l-6.2 2.3L12 19l-1.8-5.7L4 11l6.2-2.3L12 3z" />,
  book: <><path d="M12 7c-2-2-5-2-8-1v12c3-1 6-1 8 1 2-2 5-2 8-1V6c-3-1-6-1-8 1z" /><path d="M12 7v12" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5 9a7 7 0 0 1 12-2l3 5M19 15a7 7 0 0 1-12 2l-3-5" /></>
};

export default function UiIcon({ name, className = "" }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
