import type { Task } from '../../shared/model';
import { formatDate, pretty } from '../components';
import { field, select, useCBS } from '../context';

export function TaskCompletion({ task }: { task: Task }) {
  const { w, form, name } = useCBS();
  const history = task.completionHistory ?? [];
  const isOwner = task.ownerId === w.me?.id;

  return <section aria-label="Completion review">
    {task.evidence && <p><strong>Latest submitted evidence</strong><br />{task.evidence}</p>}
    {history.length > 0 && <details>
      <summary>Completion history ({history.length})</summary>
      <ol className="timeline">
        {history.map((event, index) => <li key={index}>
          <div>
            <strong>{pretty(event.kind)}</strong>
            <p>{event.kind === 'SUBMITTED' ? event.evidence : event.reason}</p>
            <small>{name(event.actorId)} · {event.kind === 'SUBMITTED' && event.legacy ? 'Earlier submission' : formatDate(event.at)}</small>
          </div>
        </li>)}
      </ol>
    </details>}
    <div className="action-row">
      {isOwner && task.status === 'OPEN' && <button className="button secondary" onClick={() =>
        form('Submit completion evidence', 'completeTask', { id: task.id }, [
          field('evidence', 'Evidence for independent review', 'textarea'),
        ])
      }>{history.length ? 'Submit corrected evidence' : 'Submit completion'}</button>}
      {w.reviewTaskIds.includes(task.id) && <button className="button secondary" onClick={() =>
        form('Review task completion', 'reviewTaskCompletion', { id: task.id, revision: history.length }, [
          select('decision', 'Decision', [
            { value: 'APPROVED', label: 'Approve completion' },
            { value: 'CORRECTIONS_REQUESTED', label: 'Request corrections' },
          ]),
          field('reason', 'Review reason and any corrections needed', 'textarea'),
        ], `Submitted evidence\n${task.evidence}`)
      }>Review completion</button>}
    </div>
  </section>;
}
