import { Link } from 'react-router-dom'

const DESCRIPTION_LIMIT = 100

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function VoteCard({
  id,
  title,
  projectType,
  requirements,
  description,
  pointMultiplier,
  voteScore,
  voteCount,
  showScores,
  canVote,
  hasVoted,
  onVote,
}) {
  return (
    <article className="vote-card">
      <div className="vote-card__header">
        <span className="vote-card__category">{projectType}</span>
        <span className="vote-card__status">
          x{pointMultiplier.toFixed(2)}
        </span>
      </div>

      <div className="vote-card__body">
        <h3>{title}</h3>
        <p>{truncateText(description, DESCRIPTION_LIMIT)}</p>
      </div>

      <dl className="vote-card__details">
        <div>
          <dt>Requirements</dt>
          <dd>{requirements}</dd>
        </div>
        {showScores ? (
          <>
            <div>
              <dt>Score</dt>
              <dd>{voteScore.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Votes</dt>
              <dd>{voteCount}</dd>
            </div>
          </>
        ) : null}
      </dl>

      <div className="vote-card__footer">
        <Link to={`/projects/${id}`} className="vote-card__link">
          View details
        </Link>
        <button
          type="button"
          className="vote-card__button"
          onClick={() => onVote(id)}
          disabled={!canVote}
        >
          {hasVoted ? 'Vote locked' : 'Cast vote'}
        </button>
      </div>
    </article>
  )
}
