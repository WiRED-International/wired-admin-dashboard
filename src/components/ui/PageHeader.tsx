type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div style={styles.wrapper}>

      <div>
        <h1 style={styles.title}>
          {title}
        </h1>

        {subtitle && (
          <p style={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={styles.actions}>
          {actions}
        </div>
      )}

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  wrapper: {
    display: "flex",

    justifyContent: "space-between",

    alignItems: "flex-start",

    gap: "20px",

    marginBottom: "28px",

    flexWrap: "wrap",
  },

  title: {
    margin: 0,

    fontFamily: "Inter, sans-serif",

    fontWeight: 700,

    fontSize: "32px",

    color: "#1E293B",

    letterSpacing: "-0.5px",
  },

  subtitle: {
    marginTop: "8px",

    fontSize: "15px",

    color: "#64748B",

    fontFamily: "Inter, sans-serif",
  },

  actions: {
    display: "flex",

    alignItems: "center",

    gap: "12px",
  },
};