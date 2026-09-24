const Loading = ({ text = 'Loading...' }) => (
  <div className="loading-container">
    <div className="spinner" role="status" aria-label="Loading" />
    <p className="loading-text">{text}</p>
  </div>
);

export default Loading;
