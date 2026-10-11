-- Phase 1C read-only cross-owner and missing-reference audit.
WITH checks AS (
 SELECT 'transactions.account_id' AS reference, count(*) FILTER (WHERE a.id IS NULL) AS missing, count(*) FILTER (WHERE a.id IS NOT NULL AND a.user_id<>t.user_id) AS cross_owner
 FROM public.transactions t LEFT JOIN public.accounts a ON a.id=t.account_id WHERE t.account_id IS NOT NULL
 UNION ALL SELECT 'transactions.to_account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>t.user_id)
 FROM public.transactions t LEFT JOIN public.accounts a ON a.id=t.to_account_id WHERE t.to_account_id IS NOT NULL
 UNION ALL SELECT 'transactions.category_id',count(*) FILTER(WHERE c.id IS NULL),count(*) FILTER(WHERE c.id IS NOT NULL AND c.user_id<>t.user_id)
 FROM public.transactions t LEFT JOIN public.categories c ON c.id=t.category_id WHERE t.category_id IS NOT NULL
 UNION ALL SELECT 'transactions.savings_goal_id',count(*) FILTER(WHERE g.id IS NULL),count(*) FILTER(WHERE g.id IS NOT NULL AND g.user_id<>t.user_id)
 FROM public.transactions t LEFT JOIN public.savings_goals g ON g.id=t.savings_goal_id WHERE t.savings_goal_id IS NOT NULL
 UNION ALL SELECT 'transactions.recurring_transaction_id',count(*) FILTER(WHERE r.id IS NULL),count(*) FILTER(WHERE r.id IS NOT NULL AND r.user_id<>t.user_id)
 FROM public.transactions t LEFT JOIN public.recurring_transactions r ON r.id=t.recurring_transaction_id WHERE t.recurring_transaction_id IS NOT NULL
 UNION ALL SELECT 'transactions.goal_contribution_id',count(*) FILTER(WHERE gc.id IS NULL),count(*) FILTER(WHERE gc.id IS NOT NULL AND gc.user_id<>t.user_id)
 FROM public.transactions t LEFT JOIN public.goal_contributions gc ON gc.id=t.goal_contribution_id WHERE t.goal_contribution_id IS NOT NULL
 UNION ALL SELECT 'goal_contributions.goal_id',count(*) FILTER(WHERE g.id IS NULL),count(*) FILTER(WHERE g.id IS NOT NULL AND g.user_id<>gc.user_id)
 FROM public.goal_contributions gc LEFT JOIN public.savings_goals g ON g.id=gc.goal_id
 UNION ALL SELECT 'goal_contributions.account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>gc.user_id)
 FROM public.goal_contributions gc LEFT JOIN public.accounts a ON a.id=gc.account_id WHERE gc.account_id IS NOT NULL
 UNION ALL SELECT 'goal_contributions.transaction_id',count(*) FILTER(WHERE t.id IS NULL),count(*) FILTER(WHERE t.id IS NOT NULL AND t.user_id<>gc.user_id)
 FROM public.goal_contributions gc LEFT JOIN public.transactions t ON t.id=gc.transaction_id WHERE gc.transaction_id IS NOT NULL
 UNION ALL SELECT 'recurring_transactions.account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>r.user_id)
 FROM public.recurring_transactions r LEFT JOIN public.accounts a ON a.id=r.account_id
 UNION ALL SELECT 'recurring_transactions.to_account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>r.user_id)
 FROM public.recurring_transactions r LEFT JOIN public.accounts a ON a.id=r.to_account_id WHERE r.to_account_id IS NOT NULL
 UNION ALL SELECT 'recurring_transactions.category_id',count(*) FILTER(WHERE c.id IS NULL),count(*) FILTER(WHERE c.id IS NOT NULL AND c.user_id<>r.user_id)
 FROM public.recurring_transactions r LEFT JOIN public.categories c ON c.id=r.category_id WHERE r.category_id IS NOT NULL
 UNION ALL SELECT 'savings_goals.from_account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>g.user_id)
 FROM public.savings_goals g LEFT JOIN public.accounts a ON a.id=g.from_account_id WHERE g.from_account_id IS NOT NULL
 UNION ALL SELECT 'savings_goals.to_account_id',count(*) FILTER(WHERE a.id IS NULL),count(*) FILTER(WHERE a.id IS NOT NULL AND a.user_id<>g.user_id)
 FROM public.savings_goals g LEFT JOIN public.accounts a ON a.id=g.to_account_id WHERE g.to_account_id IS NOT NULL
)
SELECT * FROM checks ORDER BY reference;
