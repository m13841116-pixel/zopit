import React from "react";

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const AppLink: React.FC<AppLinkProps> = ({
  href,
  children,
  onClick,
  className = "",
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If opening in new tab or modified click, let browser handle normally
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0 || props.target === "_blank") {
      if (onClick) onClick(e);
      return;
    }

    // Only intercept local internal paths
    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      if (window.location.pathname !== href) {
        window.history.pushState(null, "", href);
        window.dispatchEvent(new Event("popstate"));
      }
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};

export default AppLink;
