-- Phase 1E goal investigation (read-only).
-- Lists only goals with a progress mismatch or amount above target.
WITH contribution_totals AS (
 SELECT g.id,g.name,g.target_amount,g.starting_amount,g.current_amount,
        g.contribution_mode,g.completed_at,g.start_date,g.target_date,
        count(c.id) AS contribution_count,
        coalesce(sum(c.amount),0) AS contributed_amount
 FROM public.savings_goals g
 LEFT JOIN public.goal_contributions c ON c.goal_id=g.id AND c.user_id=g.user_id
 WHERE g.user_id=auth.uid()
 GROUP BY g.id
), checked AS (
 SELECT *,coalesce(starting_amount,0)+contributed_amount AS recorded_total,
 least(target_amount,greatest(0,coalesce(starting_amount,0)+contributed_amount)) AS expected_capped_progress
 FROM contribution_totals
)
SELECT name,contribution_mode,target_amount,starting_amount,contribution_count,
 contributed_amount,recorded_total,current_amount,expected_capped_progress,
 round(current_amount-expected_capped_progress,2) AS progress_difference,
 current_amount>target_amount+0.005 AS above_target,
 completed_at IS NOT NULL AS completed
FROM checked
WHERE abs(current_amount-expected_capped_progress)>0.01
 OR current_amount>target_amount+0.005
ORDER BY abs(current_amount-expected_capped_progress) DESC,name;