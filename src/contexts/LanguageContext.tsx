import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ja' | 'zh' | 'es' | 'alien';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'app.title': 'IMSCHM - Industrial Monitoring System',
    'app.subtitle': 'Causal Health Monitoring with Neural Networks',
    'language.select': 'Language',
    
    // Status
    'status.running': 'Running',
    'status.stopped': 'Stopped',
    'status.healthy': 'Healthy',
    'status.warning': 'Warning',
    'status.critical': 'Critical',
    
    // Controls
    'control.start': 'Start',
    'control.stop': 'Stop',
    'control.reset': 'Reset',
    'control.run_examples': 'Run 2 Examples',
    'control.run_verification': 'Run Verification Suite',
    
    // Tabs
    'tab.monitor': 'Monitor',
    'tab.causal': 'Causal',
    'tab.intervention': 'do()',
    'tab.whatif': 'What-If',
    'tab.prescriptive': 'Prescriptive',
    'tab.verification': 'Verify',
    'tab.examples': 'Examples',
    'tab.cases': 'Cases',
    'tab.knowledge': 'Knowledge',
    'tab.results': 'Results',
    
    // Results Panel
    'results.title': 'Operation Results',
    'results.description': 'View, explain, and export all operation results from CVGG, interventions, counterfactuals, and more.',
    'results.export': 'Export',
    'results.clear': 'Clear All',
    'results.saved': 'Result Saved',
    'results.generateExampleCase': 'Generate Example&Case',
    'results.generateDatasetReport': 'Generate Dataset Report',
    'results.generateThesisChapter': 'Generate Thesis Chapter',
    'results.generateAcademicReport': 'Generate IMSCHM Report',
    
    // Metrics
    'metric.thrust': 'Thrust',
    'metric.temperature': 'Temperature',
    'metric.vibration': 'Vibration',
    'metric.pressure': 'Pressure',
    'metric.rpm': 'RPM',
    'metric.efficiency': 'Efficiency',
    
    // Causal Panel
    'causal.title': 'Causal Analysis',
    'causal.ate': 'Average Treatment Effect',
    'causal.cate': 'Conditional Average Treatment Effect',
    'causal.discovery': 'Causal Discovery',
    'causal.graph': 'Causal Graph',
    
    // Intervention Panel
    'intervention.title': 'Causal Intervention (do-calculus)',
    'intervention.select': 'Select Intervention',
    'intervention.execute': 'Execute Intervention',
    'intervention.results': 'Intervention Results',
    'intervention.primary_effect': 'Primary Effect',
    'intervention.secondary_effects': 'Secondary Effects',
    'intervention.risk': 'Risk Assessment',
    
    // Counterfactual Panel
    'counterfactual.title': 'Counterfactual Analysis',
    'counterfactual.query': 'What-If Query',
    'counterfactual.result': 'Counterfactual Result',
    'counterfactual.confidence': 'Confidence',
    
    // Prescriptive Panel
    'prescriptive.title': 'Prescriptive AI Recommendations',
    'prescriptive.action': 'Recommended Action',
    'prescriptive.priority': 'Priority',
    'prescriptive.impact': 'Expected Impact',
    
    // Verification Panel
    'verification.title': 'Dataset Verification',
    'verification.tests': 'Tests',
    'verification.physics': 'Physics',
    'verification.evidence': 'Evidence',
    'verification.passed': 'Passed',
    'verification.failed': 'Failed',
    
    // Function Status
    'function.status': 'Function Completion Status',
    'function.complete': 'Complete',
    'function.partial': 'Partial',
    'function.pending': 'Pending',
    
    // Examples Panel
    'examplesPanel': 'Causal Analysis Examples',
    'examplesDescription': 'Concrete examples with actual float values for TBM device monitoring',
    'causalEffects': 'CVGG Effects',
    'counterfactual': 'Counterfactual',
    'prescriptiveAI': 'Prescriptive AI',
    'decisionVsPrescriptive': 'Decision vs Prescriptive',
    'causalEffectDescription': 'Average and Conditional Treatment Effects from CVGG inference',
    'counterfactualDescription': 'What-If analysis with hypothetical interventions',
    'prescriptiveDescription': 'AI-generated recommendations based on causal analysis',
    'floatValues': 'Float Values',
    'normalOperation': 'Normal',
    'faultCondition': 'Fault',
    'confidence': 'Confidence',
    'directEffect': 'Direct Effect',
    'indirectEffect': 'Indirect Effect',
    'metric': 'Metric',
    'value': 'Value',
    'baselineOutcome': 'Baseline Outcome',
    'counterfactualOutcome': 'Counterfactual Outcome',
    'causalEffect': 'Causal Effect',
    'riskIncreased': 'Risk Increased',
    'riskDecreased': 'Risk Decreased',
    'riskUnchanged': 'Risk Unchanged',
    'recommendation': 'Recommendation',
    'riskReduction': 'Risk Reduction',
    'costSaving': 'Cost Saving',
    'downtimeAvoided': 'Downtime Avoided',
    'prescriptiveVsDecision': 'Prescriptive AI vs Decision Making',
    'decisionMaking': 'Decision Making',
    'prescriptiveFeature1': 'Generates multiple recommendations',
    'prescriptiveFeature2': 'Ranks by causal impact (ATE/CATE)',
    'prescriptiveFeature3': 'Outputs: action + priority + confidence',
    'decisionFeature1': 'Selects single optimal action',
    'decisionFeature2': 'Considers constraints (budget, time)',
    'decisionFeature3': 'Outputs: execution plan + cost + timeline',
    'prescriptiveInputs': 'Prescriptive AI Inputs',
    'decisionOutput': 'Decision Output',
    'action': 'Action',
    'score': 'Score',
    'executionCost': 'Execution Cost',
    'budget': 'Budget',
    'timeline': 'Timeline',
    'floatValueReference': 'Float Value Reference',
    'floatValueReferenceDesc': 'Summary of all metrics and their meanings',
    'symbol': 'Symbol',
    'range': 'Range',
    'interpretation': 'Interpretation',
    'doCalculus': 'do-Calculus',
    'doCalculusDescription': 'Causal interventions using P(Y | do(X = x)) notation',
    'doCalculusNotation': 'do-Calculus Notation',
    'targetVariable': 'Target Variable',
    'primaryEffects': 'Primary Effects',
    'secondaryEffects': 'Secondary (Cascade) Effects',
    'riskAssessment': 'Risk Assessment',
    'baselineRisk': 'Baseline Risk',
    'interventionRisk': 'Post-Intervention Risk',
    'risk': 'Risk',
    
    // Operation Cases
    'operationCases.title': 'Industrial Operation Cases',
    'operationCases.description': '5 comprehensive cases illustrating IMSCHM processes from TBM startup to decision making',
    'operationCases.summaryTable': 'Case Summary',
    'case1.title': 'Case 1: Normal Operation Baseline - Startup to Steady State',
    'case1.scenario': 'TBM initial startup and transition to stable boring operation',
    'case1.trainingGoal': 'Establish baseline understanding of normal CVGG outputs and healthy causal relationships',
    'case2.title': 'Case 2: Gradual Bearing Wear Detection - Early Warning Success',
    'case2.scenario': 'Detect early bearing degradation before catastrophic failure',
    'case2.trainingGoal': 'Demonstrate early warning capability - detection at severity=0.48 prevents catastrophic failure',
    'case3.title': 'Case 3: Thermal Overload Emergency - Immediate Intervention',
    'case3.scenario': 'Sudden thermal spike requiring emergency response',
    'case3.trainingGoal': 'Demonstrate emergency response pathway - CRITICAL priority bypasses normal scheduling',
    'case4.title': 'Case 4: Hydraulic Leak Diagnosis - Root Cause Tracing',
    'case4.scenario': 'Identify and trace hydraulic leak through causal pathways',
    'case4.trainingGoal': 'Demonstrate causal pathway tracing from symptom to root cause using CVGG embeddings',
    'case5.title': 'Case 5: Multi-Fault Competing Causes - Complex Decision Scenario',
    'case5.scenario': 'Multiple simultaneous faults requiring prioritized response',
    'case5.trainingGoal': 'Demonstrate complex multi-fault diagnosis with causal disentanglement',
    
    // Knowledge Base
    'knowledgeBase.title': 'Causal Knowledge Base',
    'knowledgeBase.description': 'Graph-native knowledge store for industrial causal relationships',
    
    // General
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.success': 'Success',
    'general.cancel': 'Cancel',
    'general.confirm': 'Confirm',
    'general.save': 'Save',
    'general.close': 'Close',
  },
  
  ja: {
    // Header
    'app.title': 'IMSCHM - 産業監視システム',
    'app.subtitle': 'ニューラルネットワークによる因果健康監視',
    'language.select': '言語',
    
    // Status
    'status.running': '実行中',
    'status.stopped': '停止',
    'status.healthy': '正常',
    'status.warning': '警告',
    'status.critical': '危険',
    
    // Controls
    'control.start': '開始',
    'control.stop': '停止',
    'control.reset': 'リセット',
    'control.run_examples': '2例を実行',
    'control.run_verification': '検証スイートを実行',
    
    // Tabs
    'tab.monitor': 'モニター',
    'tab.causal': '因果',
    'tab.intervention': 'do()',
    'tab.whatif': '仮説',
    'tab.prescriptive': '処方',
    'tab.verification': '検証',
    'tab.examples': '例',
    'tab.cases': '事例',
    'tab.knowledge': '知識ベース',
    'tab.results': '結果',
    
    // Results Panel
    'results.title': '操作結果',
    'results.description': 'CVGG、介入、反事実などの全ての操作結果を表示、説明、エクスポート',
    'results.export': 'エクスポート',
    'results.clear': '全てクリア',
    'results.saved': '結果を保存しました',
    'results.generateExampleCase': '例&事例を生成',
    'results.generateDatasetReport': 'データセットレポート生成',
    'results.generateThesisChapter': '論文チャプター生成',
    'results.generateAcademicReport': 'IMSCHM学術レポート生成',
    
    // Knowledge Base
    'knowledgeBase.title': '因果知識ベース',
    'knowledgeBase.description': '産業因果関係のグラフネイティブ知識ストア',
    'metric.thrust': '推力',
    'metric.temperature': '温度',
    'metric.vibration': '振動',
    'metric.pressure': '圧力',
    'metric.rpm': '回転数',
    'metric.efficiency': '効率',
    
    // Causal Panel
    'causal.title': '因果分析',
    'causal.ate': '平均処置効果',
    'causal.cate': '条件付き平均処置効果',
    'causal.discovery': '因果発見',
    'causal.graph': '因果グラフ',
    
    // Intervention Panel
    'intervention.title': '因果介入 (do計算)',
    'intervention.select': '介入を選択',
    'intervention.execute': '介入を実行',
    'intervention.results': '介入結果',
    'intervention.primary_effect': '主効果',
    'intervention.secondary_effects': '副次効果',
    'intervention.risk': 'リスク評価',
    
    // Counterfactual Panel
    'counterfactual.title': '反事実分析',
    'counterfactual.query': '仮説クエリ',
    'counterfactual.result': '反事実結果',
    'counterfactual.confidence': '信頼度',
    
    // Prescriptive Panel
    'prescriptive.title': '処方AIの推奨',
    'prescriptive.action': '推奨アクション',
    'prescriptive.priority': '優先度',
    'prescriptive.impact': '予想される影響',
    
    // Verification Panel
    'verification.title': 'データセット検証',
    'verification.tests': 'テスト',
    'verification.physics': '物理',
    'verification.evidence': '証拠',
    'verification.passed': '合格',
    'verification.failed': '不合格',
    
    // Function Status
    'function.status': '機能完了状態',
    'function.complete': '完了',
    'function.partial': '部分的',
    'function.pending': '保留',
    
    // Examples Panel
    'examplesPanel': '因果分析の例',
    'examplesDescription': 'TBMデバイス監視のための実際の浮動小数点値を含む具体例',
    'causalEffects': 'CVGG効果',
    'counterfactual': '反事実',
    'prescriptiveAI': '処方AI',
    'decisionVsPrescriptive': '意思決定 vs 処方',
    'causalEffectDescription': 'CVGG推論からの平均および条件付き処置効果',
    'counterfactualDescription': '仮説的介入によるWhat-If分析',
    'prescriptiveDescription': '因果分析に基づくAI生成推奨',
    'floatValues': '浮動小数点値',
    'normalOperation': '正常',
    'faultCondition': '異常',
    'confidence': '信頼度',
    'directEffect': '直接効果',
    'indirectEffect': '間接効果',
    'metric': '指標',
    'value': '値',
    'baselineOutcome': 'ベースライン結果',
    'counterfactualOutcome': '反事実結果',
    'causalEffect': '因果効果',
    'riskIncreased': 'リスク増加',
    'riskDecreased': 'リスク減少',
    'riskUnchanged': 'リスク不変',
    'recommendation': '推奨',
    'riskReduction': 'リスク削減',
    'costSaving': 'コスト削減',
    'downtimeAvoided': 'ダウンタイム回避',
    'prescriptiveVsDecision': '処方AI vs 意思決定',
    'decisionMaking': '意思決定',
    'prescriptiveFeature1': '複数の推奨を生成',
    'prescriptiveFeature2': '因果効果でランク付け (ATE/CATE)',
    'prescriptiveFeature3': '出力: アクション + 優先度 + 信頼度',
    'decisionFeature1': '単一の最適アクションを選択',
    'decisionFeature2': '制約を考慮 (予算、時間)',
    'decisionFeature3': '出力: 実行計画 + コスト + タイムライン',
    'prescriptiveInputs': '処方AI入力',
    'decisionOutput': '意思決定出力',
    'action': 'アクション',
    'score': 'スコア',
    'executionCost': '実行コスト',
    'budget': '予算',
    'timeline': 'タイムライン',
    'floatValueReference': '浮動小数点値リファレンス',
    'floatValueReferenceDesc': '全ての指標とその意味のサマリー',
    'symbol': '記号',
    'range': '範囲',
    'interpretation': '解釈',
    'doCalculus': 'do計算',
    'doCalculusDescription': 'P(Y | do(X = x)) 表記を使用した因果介入',
    'doCalculusNotation': 'do計算表記',
    'targetVariable': '目標変数',
    'primaryEffects': '主効果',
    'secondaryEffects': '二次効果（連鎖）',
    'riskAssessment': 'リスク評価',
    'baselineRisk': 'ベースラインリスク',
    'interventionRisk': '介入後リスク',
    'risk': 'リスク',
    
    // Operation Cases
    'operationCases.title': '産業運用事例',
    'operationCases.description': 'TBM起動から意思決定までのIMSCHMプロセスを示す5つの包括的な事例',
    'operationCases.summaryTable': '事例サマリー',
    'case1.title': '事例1: 通常運転ベースライン - 起動から定常状態',
    'case1.scenario': 'TBM初期起動と安定掘削運転への移行',
    'case1.trainingGoal': '正常なCVGG出力と健全な因果関係の基本理解を確立',
    'case2.title': '事例2: 段階的なベアリング摩耗検出 - 早期警告成功',
    'case2.scenario': '壊滅的故障前の早期ベアリング劣化を検出',
    'case2.trainingGoal': '早期警告機能を実証 - severity=0.48で検出し壊滅的故障を防止',
    'case3.title': '事例3: 熱過負荷緊急事態 - 即時介入',
    'case3.scenario': '緊急対応が必要な突然の熱スパイク',
    'case3.trainingGoal': '緊急対応経路を実証 - CRITICAL優先度は通常スケジュールをバイパス',
    'case4.title': '事例4: 油圧漏れ診断 - 根本原因追跡',
    'case4.scenario': '因果経路を通じて油圧漏れを特定・追跡',
    'case4.trainingGoal': 'CVGG埋め込みを使用した症状から根本原因への因果経路追跡を実証',
    'case5.title': '事例5: 複数故障競合原因 - 複雑な意思決定シナリオ',
    'case5.scenario': '優先対応が必要な複数の同時故障',
    'case5.trainingGoal': '因果分離と複雑な複数故障診断を実証',
    
    // General
    'general.loading': '読み込み中...',
    'general.error': 'エラー',
    'general.success': '成功',
    'general.cancel': 'キャンセル',
    'general.confirm': '確認',
    'general.save': '保存',
    'general.close': '閉じる',
  },
  
  zh: {
    // Header
    'app.title': 'IMSCHM - 工业监控系统',
    'app.subtitle': '神经网络因果健康监测',
    'language.select': '语言',
    
    // Status
    'status.running': '运行中',
    'status.stopped': '已停止',
    'status.healthy': '健康',
    'status.warning': '警告',
    'status.critical': '危险',
    
    // Controls
    'control.start': '启动',
    'control.stop': '停止',
    'control.reset': '重置',
    'control.run_examples': '运行2个示例',
    'control.run_verification': '运行验证套件',
    
    // Tabs
    'tab.monitor': '监控',
    'tab.causal': '因果',
    'tab.intervention': 'do()',
    'tab.whatif': '假设',
    'tab.prescriptive': '处方',
    'tab.verification': '验证',
    'tab.examples': '示例',
    'tab.cases': '案例',
    'tab.knowledge': '知识库',
    'tab.results': '结果',
    
    // Results Panel
    'results.title': '操作结果',
    'results.description': '查看、解释和导出CVGG、干预、反事实等所有操作结果',
    'results.export': '导出',
    'results.clear': '全部清除',
    'results.saved': '结果已保存',
    'results.generateExampleCase': '生成示例&案例',
    'results.generateDatasetReport': '生成数据集报告',
    'results.generateThesisChapter': '生成论文章节',
    'results.generateAcademicReport': '生成IMSCHM学术报告',
    
    // Knowledge Base
    'knowledgeBase.title': '因果知识库',
    'knowledgeBase.description': '工业因果关系的图原生知识存储',
    'metric.thrust': '推力',
    'metric.temperature': '温度',
    'metric.vibration': '振动',
    'metric.pressure': '压力',
    'metric.rpm': '转速',
    'metric.efficiency': '效率',
    
    // Causal Panel
    'causal.title': '因果分析',
    'causal.ate': '平均处理效应',
    'causal.cate': '条件平均处理效应',
    'causal.discovery': '因果发现',
    'causal.graph': '因果图',
    
    // Intervention Panel
    'intervention.title': '因果干预 (do演算)',
    'intervention.select': '选择干预',
    'intervention.execute': '执行干预',
    'intervention.results': '干预结果',
    'intervention.primary_effect': '主要效应',
    'intervention.secondary_effects': '次要效应',
    'intervention.risk': '风险评估',
    
    // Counterfactual Panel
    'counterfactual.title': '反事实分析',
    'counterfactual.query': '假设查询',
    'counterfactual.result': '反事实结果',
    'counterfactual.confidence': '置信度',
    
    // Prescriptive Panel
    'prescriptive.title': '处方AI建议',
    'prescriptive.action': '建议操作',
    'prescriptive.priority': '优先级',
    'prescriptive.impact': '预期影响',
    
    // Verification Panel
    'verification.title': '数据集验证',
    'verification.tests': '测试',
    'verification.physics': '物理',
    'verification.evidence': '证据',
    'verification.passed': '通过',
    'verification.failed': '失败',
    
    // Function Status
    'function.status': '功能完成状态',
    'function.complete': '完成',
    'function.partial': '部分',
    'function.pending': '待定',
    
    // Examples Panel
    'examplesPanel': '因果分析示例',
    'examplesDescription': '用于TBM设备监控的实际浮点值具体示例',
    'causalEffects': 'CVGG效应',
    'counterfactual': '反事实',
    'prescriptiveAI': '处方AI',
    'decisionVsPrescriptive': '决策 vs 处方',
    'causalEffectDescription': 'CVGG推理的平均和条件处理效应',
    'counterfactualDescription': '假设干预的What-If分析',
    'prescriptiveDescription': '基于因果分析的AI生成建议',
    'floatValues': '浮点值',
    'normalOperation': '正常',
    'faultCondition': '故障',
    'confidence': '置信度',
    'directEffect': '直接效应',
    'indirectEffect': '间接效应',
    'metric': '指标',
    'value': '值',
    'baselineOutcome': '基线结果',
    'counterfactualOutcome': '反事实结果',
    'causalEffect': '因果效应',
    'riskIncreased': '风险增加',
    'riskDecreased': '风险降低',
    'riskUnchanged': '风险不变',
    'recommendation': '建议',
    'riskReduction': '风险降低',
    'costSaving': '成本节省',
    'downtimeAvoided': '避免停机',
    'prescriptiveVsDecision': '处方AI vs 决策',
    'decisionMaking': '决策制定',
    'prescriptiveFeature1': '生成多个建议',
    'prescriptiveFeature2': '按因果影响排名 (ATE/CATE)',
    'prescriptiveFeature3': '输出: 行动 + 优先级 + 置信度',
    'decisionFeature1': '选择单一最优行动',
    'decisionFeature2': '考虑约束 (预算、时间)',
    'decisionFeature3': '输出: 执行计划 + 成本 + 时间线',
    'prescriptiveInputs': '处方AI输入',
    'decisionOutput': '决策输出',
    'action': '行动',
    'score': '评分',
    'executionCost': '执行成本',
    'budget': '预算',
    'timeline': '时间线',
    'floatValueReference': '浮点值参考',
    'floatValueReferenceDesc': '所有指标及其含义的摘要',
    'symbol': '符号',
    'range': '范围',
    'interpretation': '解释',
    'doCalculus': 'do演算',
    'doCalculusDescription': '使用 P(Y | do(X = x)) 表示法的因果干预',
    'doCalculusNotation': 'do演算表示法',
    'targetVariable': '目标变量',
    'primaryEffects': '主要效应',
    'secondaryEffects': '次要效应（级联）',
    'riskAssessment': '风险评估',
    'baselineRisk': '基线风险',
    'interventionRisk': '干预后风险',
    'risk': '风险',
    
    // Operation Cases
    'operationCases.title': '工业运行案例',
    'operationCases.description': '5个全面案例展示从TBM启动到决策的IMSCHM流程',
    'operationCases.summaryTable': '案例摘要',
    'case1.title': '案例1: 正常运行基线 - 启动到稳态',
    'case1.scenario': 'TBM初始启动并过渡到稳定掘进运行',
    'case1.trainingGoal': '建立对正常CVGG输出和健康因果关系的基本理解',
    'case2.title': '案例2: 渐进轴承磨损检测 - 早期预警成功',
    'case2.scenario': '在灾难性故障前检测早期轴承退化',
    'case2.trainingGoal': '展示早期预警能力 - 在severity=0.48时检测防止灾难性故障',
    'case3.title': '案例3: 热过载紧急情况 - 立即干预',
    'case3.scenario': '需要紧急响应的突发热峰值',
    'case3.trainingGoal': '展示紧急响应路径 - CRITICAL优先级绕过正常调度',
    'case4.title': '案例4: 液压泄漏诊断 - 根本原因追溯',
    'case4.scenario': '通过因果路径识别和追溯液压泄漏',
    'case4.trainingGoal': '展示使用CVGG嵌入从症状到根本原因的因果路径追溯',
    'case5.title': '案例5: 多故障竞争原因 - 复杂决策场景',
    'case5.scenario': '需要优先响应的多个同时故障',
    'case5.trainingGoal': '展示因果分离和复杂多故障诊断',
    
    // General
    'general.loading': '加载中...',
    'general.error': '错误',
    'general.success': '成功',
    'general.cancel': '取消',
    'general.confirm': '确认',
    'general.save': '保存',
    'general.close': '关闭',
  },
  
  es: {
    // Header
    'app.title': 'IMSCHM - Sistema de Monitoreo Industrial',
    'app.subtitle': 'Monitoreo Causal de Salud con Redes Neuronales',
    'language.select': 'Idioma',
    
    // Status
    'status.running': 'Ejecutando',
    'status.stopped': 'Detenido',
    'status.healthy': 'Saludable',
    'status.warning': 'Advertencia',
    'status.critical': 'Crítico',
    
    // Controls
    'control.start': 'Iniciar',
    'control.stop': 'Detener',
    'control.reset': 'Reiniciar',
    'control.run_examples': 'Ejecutar 2 Ejemplos',
    'control.run_verification': 'Ejecutar Suite de Verificación',
    
    // Tabs
    'tab.monitor': 'Monitor',
    'tab.causal': 'Causal',
    'tab.intervention': 'do()',
    'tab.whatif': 'Hipótesis',
    'tab.prescriptive': 'Prescriptivo',
    'tab.verification': 'Verificar',
    'tab.examples': 'Ejemplos',
    'tab.cases': 'Casos',
    'tab.knowledge': 'Conocimiento',
    'tab.results': 'Resultados',
    
    // Results Panel
    'results.title': 'Resultados de Operaciones',
    'results.description': 'Ver, explicar y exportar todos los resultados de CVGG, intervenciones, contrafactuales y más',
    'results.export': 'Exportar',
    'results.clear': 'Limpiar Todo',
    'results.saved': 'Resultado Guardado',
    'results.generateExampleCase': 'Generar Ejemplo&Caso',
    'results.generateDatasetReport': 'Generar Informe Dataset',
    'results.generateThesisChapter': 'Generar Capítulo de Tesis',
    'results.generateAcademicReport': 'Generar Informe IMSCHM',
    
    // Knowledge Base
    'knowledgeBase.title': 'Base de Conocimiento Causal',
    'knowledgeBase.description': 'Almacén de conocimiento nativo de gráficos para relaciones causales industriales',
    'metric.thrust': 'Empuje',
    'metric.temperature': 'Temperatura',
    'metric.vibration': 'Vibración',
    'metric.pressure': 'Presión',
    'metric.rpm': 'RPM',
    'metric.efficiency': 'Eficiencia',
    
    // Causal Panel
    'causal.title': 'Análisis Causal',
    'causal.ate': 'Efecto Promedio del Tratamiento',
    'causal.cate': 'Efecto Promedio Condicional',
    'causal.discovery': 'Descubrimiento Causal',
    'causal.graph': 'Grafo Causal',
    
    // Intervention Panel
    'intervention.title': 'Intervención Causal (do-cálculo)',
    'intervention.select': 'Seleccionar Intervención',
    'intervention.execute': 'Ejecutar Intervención',
    'intervention.results': 'Resultados de Intervención',
    'intervention.primary_effect': 'Efecto Primario',
    'intervention.secondary_effects': 'Efectos Secundarios',
    'intervention.risk': 'Evaluación de Riesgo',
    
    // Counterfactual Panel
    'counterfactual.title': 'Análisis Contrafactual',
    'counterfactual.query': 'Consulta Hipotética',
    'counterfactual.result': 'Resultado Contrafactual',
    'counterfactual.confidence': 'Confianza',
    
    // Prescriptive Panel
    'prescriptive.title': 'Recomendaciones de IA Prescriptiva',
    'prescriptive.action': 'Acción Recomendada',
    'prescriptive.priority': 'Prioridad',
    'prescriptive.impact': 'Impacto Esperado',
    
    // Verification Panel
    'verification.title': 'Verificación del Conjunto de Datos',
    'verification.tests': 'Pruebas',
    'verification.physics': 'Física',
    'verification.evidence': 'Evidencia',
    'verification.passed': 'Aprobado',
    'verification.failed': 'Fallido',
    
    // Function Status
    'function.status': 'Estado de Completación de Funciones',
    'function.complete': 'Completo',
    'function.partial': 'Parcial',
    'function.pending': 'Pendiente',
    
    // Examples Panel
    'examplesPanel': 'Ejemplos de Análisis Causal',
    'examplesDescription': 'Ejemplos concretos con valores flotantes reales para monitoreo de dispositivos TBM',
    'causalEffects': 'Efectos CVGG',
    'counterfactual': 'Contrafactual',
    'prescriptiveAI': 'IA Prescriptiva',
    'decisionVsPrescriptive': 'Decisión vs Prescriptivo',
    'causalEffectDescription': 'Efectos de tratamiento promedio y condicional de inferencia CVGG',
    'counterfactualDescription': 'Análisis What-If con intervenciones hipotéticas',
    'prescriptiveDescription': 'Recomendaciones generadas por IA basadas en análisis causal',
    'floatValues': 'Valores Flotantes',
    'normalOperation': 'Normal',
    'faultCondition': 'Fallo',
    'confidence': 'Confianza',
    'directEffect': 'Efecto Directo',
    'indirectEffect': 'Efecto Indirecto',
    'metric': 'Métrica',
    'value': 'Valor',
    'baselineOutcome': 'Resultado Base',
    'counterfactualOutcome': 'Resultado Contrafactual',
    'causalEffect': 'Efecto Causal',
    'riskIncreased': 'Riesgo Aumentado',
    'riskDecreased': 'Riesgo Disminuido',
    'riskUnchanged': 'Riesgo Sin Cambios',
    'recommendation': 'Recomendación',
    'riskReduction': 'Reducción de Riesgo',
    'costSaving': 'Ahorro de Costos',
    'downtimeAvoided': 'Tiempo Inactivo Evitado',
    'prescriptiveVsDecision': 'IA Prescriptiva vs Toma de Decisiones',
    'decisionMaking': 'Toma de Decisiones',
    'prescriptiveFeature1': 'Genera múltiples recomendaciones',
    'prescriptiveFeature2': 'Clasifica por impacto causal (ATE/CATE)',
    'prescriptiveFeature3': 'Salidas: acción + prioridad + confianza',
    'decisionFeature1': 'Selecciona una acción óptima',
    'decisionFeature2': 'Considera restricciones (presupuesto, tiempo)',
    'decisionFeature3': 'Salidas: plan de ejecución + costo + cronograma',
    'prescriptiveInputs': 'Entradas de IA Prescriptiva',
    'decisionOutput': 'Salida de Decisión',
    'action': 'Acción',
    'score': 'Puntuación',
    'executionCost': 'Costo de Ejecución',
    'budget': 'Presupuesto',
    'timeline': 'Cronograma',
    'floatValueReference': 'Referencia de Valores Flotantes',
    'floatValueReferenceDesc': 'Resumen de todas las métricas y sus significados',
    'symbol': 'Símbolo',
    'range': 'Rango',
    'interpretation': 'Interpretación',
    'doCalculus': 'do-Cálculo',
    'doCalculusDescription': 'Intervenciones causales usando notación P(Y | do(X = x))',
    'doCalculusNotation': 'Notación do-Cálculo',
    'targetVariable': 'Variable Objetivo',
    'primaryEffects': 'Efectos Primarios',
    'secondaryEffects': 'Efectos Secundarios (Cascada)',
    'riskAssessment': 'Evaluación de Riesgo',
    'baselineRisk': 'Riesgo Base',
    'interventionRisk': 'Riesgo Post-Intervención',
    'risk': 'Riesgo',
    
    // Operation Cases
    'operationCases.title': 'Casos de Operación Industrial',
    'operationCases.description': '5 casos completos que ilustran los procesos IMSCHM desde el inicio de TBM hasta la toma de decisiones',
    'operationCases.summaryTable': 'Resumen de Casos',
    'case1.title': 'Caso 1: Línea Base de Operación Normal - Inicio a Estado Estable',
    'case1.scenario': 'Inicio inicial de TBM y transición a operación de perforación estable',
    'case1.trainingGoal': 'Establecer comprensión básica de salidas CVGG normales y relaciones causales saludables',
    'case2.title': 'Caso 2: Detección de Desgaste de Rodamiento Gradual - Éxito de Alerta Temprana',
    'case2.scenario': 'Detectar degradación temprana del rodamiento antes de falla catastrófica',
    'case2.trainingGoal': 'Demostrar capacidad de alerta temprana - detección en severity=0.48 previene falla catastrófica',
    'case3.title': 'Caso 3: Emergencia de Sobrecarga Térmica - Intervención Inmediata',
    'case3.scenario': 'Pico térmico repentino que requiere respuesta de emergencia',
    'case3.trainingGoal': 'Demostrar ruta de respuesta de emergencia - prioridad CRITICAL omite programación normal',
    'case4.title': 'Caso 4: Diagnóstico de Fuga Hidráulica - Rastreo de Causa Raíz',
    'case4.scenario': 'Identificar y rastrear fuga hidráulica a través de rutas causales',
    'case4.trainingGoal': 'Demostrar rastreo de ruta causal desde síntoma a causa raíz usando embeddings CVGG',
    'case5.title': 'Caso 5: Causas Competidoras Multi-Falla - Escenario de Decisión Compleja',
    'case5.scenario': 'Múltiples fallas simultáneas que requieren respuesta priorizada',
    'case5.trainingGoal': 'Demostrar diagnóstico complejo multi-falla con desenredo causal',
    
    // General
    'general.loading': 'Cargando...',
    'general.error': 'Error',
    'general.success': 'Éxito',
    'general.cancel': 'Cancelar',
    'general.confirm': 'Confirmar',
    'general.save': 'Guardar',
    'general.close': 'Cerrar',
  },
  
  alien: {
    // Header
    'app.title': 'IMSCHM - ⌇⍜⌰⍀⟟⏃ ⋔⍜⋏⟟⏁⍜⍀',
    'app.subtitle': '⋏⟒⎍⍀⏃⌰ ☊⏃⎍⌇⏃⌰ ⊑⟒⏃⌰⏁⊑ ⌇⊬⌇⏁⟒⋔',
    'language.select': '⌰⏃⋏☌',
    
    // Status
    'status.running': '⍀⎍⋏⋏⟟⋏☌',
    'status.stopped': '⌇⏁⍜⌿⌿⟒⎅',
    'status.healthy': '⊑⟒⏃⌰⏁⊑⊬',
    'status.warning': '⍙⏃⍀⋏⟟⋏☌',
    'status.critical': '☊⍀⟟⏁⟟☊⏃⌰',
    
    // Controls
    'control.start': '⌇⏁⏃⍀⏁',
    'control.stop': '⌇⏁⍜⌿',
    'control.reset': '⍀⟒⌇⟒⏁',
    'control.run_examples': '⍀⎍⋏ ⟒⌖⏃⋔⌿⌰⟒⌇',
    'control.run_verification': '⎐⟒⍀⟟⎎⊬ ⌇⎍⟟⏁⟒',
    
    // Tabs
    'tab.monitor': '⋔⍜⋏⟟⏁⍜⍀',
    'tab.causal': '☊⏃⎍⌇⏃⌰',
    'tab.intervention': '⎅⍜()',
    'tab.whatif': '⍙⊑⏃⏁-⟟⎎',
    'tab.prescriptive': '⌿⍀⟒⌇☊⍀⟟⌿⏁',
    'tab.verification': '⎐⟒⍀⟟⎎⊬',
    'tab.examples': '⟒⌖⏃⋔⌿⌰⟒⌇',
    'tab.cases': '☊⏃⌇⟒⌇',
    'tab.knowledge': '☍⋏⍜⍙⌰⟒⎅☌⟒',
    
    // Knowledge Base
    'knowledgeBase.title': '☊⏃⎍⌇⏃⌰ ☍⋏⍜⍙⌰⟒⎅☌⟒ ⏚⏃⌇⟒',
    'knowledgeBase.description': '☌⍀⏃⌿⊑ ⋏⏃⏁⟟⎐⟒ ⌇⏁⍜⍀⟒',
    'metric.thrust': '⏁⊑⍀⎍⌇⏁',
    'metric.temperature': '⏁⟒⋔⌿',
    'metric.vibration': '⎐⟟⏚⟒',
    'metric.pressure': '⌿⍀⟒⌇⌇',
    'metric.rpm': '⍀⌿⋔',
    'metric.efficiency': '⟒⎎⎎⟟☊',
    
    // Causal Panel
    'causal.title': '☊⏃⎍⌇⏃⌰ ⏃⋏⏃⌰⊬⌇⟟⌇',
    'causal.ate': '⏃⎐⟒⍀⏃☌⟒ ⏁⍀⟒⏃⏁⋔⟒⋏⏁',
    'causal.cate': '☊⍜⋏⎅⟟⏁⟟⍜⋏⏃⌰ ⟒⎎⎎⟒☊⏁',
    'causal.discovery': '⎅⟟⌇☊⍜⎐⟒⍀⊬',
    'causal.graph': '☊⏃⎍⌇⏃⌰ ☌⍀⏃⌿⊑',
    
    // Intervention Panel
    'intervention.title': '☊⏃⎍⌇⏃⌰ ⟟⋏⏁⟒⍀⎐⟒⋏⏁⟟⍜⋏',
    'intervention.select': '⌇⟒⌰⟒☊⏁ ⟟⋏⏁⟒⍀⎐⟒⋏⏁⟟⍜⋏',
    'intervention.execute': '⟒⌖⟒☊⎍⏁⟒',
    'intervention.results': '⍀⟒⌇⎍⌰⏁⌇',
    'intervention.primary_effect': '⌿⍀⟟⋔⏃⍀⊬ ⟒⎎⎎⟒☊⏁',
    'intervention.secondary_effects': '⌇⟒☊⍜⋏⎅⏃⍀⊬',
    'intervention.risk': '⍀⟟⌇☍ ⏃⌇⌇⟒⌇⌇',
    
    // Counterfactual Panel
    'counterfactual.title': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁⎍⏃⌰',
    'counterfactual.query': '⍙⊑⏃⏁-⟟⎎ ⍾⎍⟒⍀⊬',
    'counterfactual.result': '⍀⟒⌇⎍⌰⏁',
    'counterfactual.confidence': '☊⍜⋏⎎⟟⎅⟒⋏☊⟒',
    
    // Prescriptive Panel
    'prescriptive.title': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⏃⟟',
    'prescriptive.action': '⍀⟒☊⍜⋔⋔⟒⋏⎅⟒⎅ ⏃☊⏁⟟⍜⋏',
    'prescriptive.priority': '⌿⍀⟟⍜⍀⟟⏁⊬',
    'prescriptive.impact': '⟒⌖⌿⟒☊⏁⟒⎅ ⟟⋔⌿⏃☊⏁',
    
    // Verification Panel
    'verification.title': '⎅⏃⏁⏃⌇⟒⏁ ⎐⟒⍀⟟⎎⟟☊⏃⏁⟟⍜⋏',
    'verification.tests': '⏁⟒⌇⏁⌇',
    'verification.physics': '⌿⊑⊬⌇⟟☊⌇',
    'verification.evidence': '⟒⎐⟟⎅⟒⋏☊⟒',
    'verification.passed': '⌿⏃⌇⌇⟒⎅',
    'verification.failed': '⎎⏃⟟⌰⟒⎅',
    
    // Function Status
    'function.status': '⎎⎍⋏☊⏁⟟⍜⋏ ⌇⏁⏃⏁⎍⌇',
    'function.complete': '☊⍜⋔⌿⌰⟒⏁⟒',
    'function.partial': '⌿⏃⍀⏁⟟⏃⌰',
    'function.pending': '⌿⟒⋏⎅⟟⋏☌',
    
    // Examples Panel
    'examplesPanel': '☊⏃⎍⌇⏃⌰ ⟒⌖⏃⋔⌿⌰⟒⌇',
    'examplesDescription': '⏁⏚⋔ ⎅⟒⎐⟟☊⟒ ⋔⍜⋏⟟⏁⍜⍀⟟⋏☌',
    'causalEffects': '☊⎐☌☌ ⟒⎎⎎⟒☊⏁⌇',
    'counterfactual': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁',
    'prescriptiveAI': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⏃⟟',
    'decisionVsPrescriptive': '⎅⟒☊⟟⌇⟟⍜⋏ ⎐⌇ ⌿⍀⟒⌇☊',
    'causalEffectDescription': '⏃⏁⟒/☊⏃⏁⟒ ⎎⍀⍜⋔ ☊⎐☌☌',
    'counterfactualDescription': '⍙⊑⏃⏁-⟟⎎ ⏃⋏⏃⌰⊬⌇⟟⌇',
    'prescriptiveDescription': '⏃⟟ ⍀⟒☊⍜⋔⋔⟒⋏⎅⏃⏁⟟⍜⋏⌇',
    'floatValues': '⎎⌰⍜⏃⏁ ⎐⏃⌰⎍⟒⌇',
    'normalOperation': '⋏⍜⍀⋔⏃⌰',
    'faultCondition': '⎎⏃⎍⌰⏁',
    'confidence': '☊⍜⋏⎎⟟⎅⟒⋏☊⟒',
    'directEffect': '⎅⟟⍀⟒☊⏁ ⟒⎎⎎⟒☊⏁',
    'indirectEffect': '⟟⋏⎅⟟⍀⟒☊⏁ ⟒⎎⎎⟒☊⏁',
    'metric': '⋔⟒⏁⍀⟟☊',
    'value': '⎐⏃⌰⎍⟒',
    'baselineOutcome': '⏚⏃⌇⟒⌰⟟⋏⟒',
    'counterfactualOutcome': '☊⍜⎍⋏⏁⟒⍀⎎⏃☊⏁⎍⏃⌰',
    'causalEffect': '☊⏃⎍⌇⏃⌰ ⟒⎎⎎⟒☊⏁',
    'riskIncreased': '⍀⟟⌇☍ ⟟⋏☊⍀⟒⏃⌇⟒⎅',
    'riskDecreased': '⍀⟟⌇☍ ⎅⟒☊⍀⟒⏃⌇⟒⎅',
    'riskUnchanged': '⍀⟟⌇☍ ⎍⋏☊⊑⏃⋏☌⟒⎅',
    'recommendation': '⍀⟒☊⍜⋔⋔⟒⋏⎅',
    'riskReduction': '⍀⟟⌇☍ ⍀⟒⎅⎍☊⏁⟟⍜⋏',
    'costSaving': '☊⍜⌇⏁ ⌇⏃⎐⟟⋏☌',
    'downtimeAvoided': '⎅⍜⍙⋏⏁⟟⋔⟒ ⏃⎐⍜⟟⎅⟒⎅',
    'prescriptiveVsDecision': '⌿⍀⟒⌇☊⍀⟟⌿⏁⟟⎐⟒ ⎐⌇ ⎅⟒☊⟟⌇⟟⍜⋏',
    'decisionMaking': '⎅⟒☊⟟⌇⟟⍜⋏ ⋔⏃☍⟟⋏☌',
    'prescriptiveFeature1': '⋔⎍⌰⏁⟟⌿⌰⟒ ⍀⟒☊⌇',
    'prescriptiveFeature2': '⍀⏃⋏☍ ⏚⊬ ⏃⏁⟒/☊⏃⏁⟒',
    'prescriptiveFeature3': '⏃☊⏁⟟⍜⋏ + ⌿⍀⟟⍜⍀⟟⏁⊬',
    'decisionFeature1': '⌇⟒⌰⟒☊⏁ ⍜⌿⏁⟟⋔⏃⌰',
    'decisionFeature2': '☊⍜⋏⌇⏁⍀⏃⟟⋏⏁⌇',
    'decisionFeature3': '⌿⌰⏃⋏ + ☊⍜⌇⏁ + ⏁⟟⋔⟒',
    'prescriptiveInputs': '⌿⍀⟒⌇☊ ⟟⋏⌿⎍⏁⌇',
    'decisionOutput': '⎅⟒☊⟟⌇⟟⍜⋏ ⍜⎍⏁⌿⎍⏁',
    'action': '⏃☊⏁⟟⍜⋏',
    'score': '⌇☊⍜⍀⟒',
    'executionCost': '⟒⌖⟒☊ ☊⍜⌇⏁',
    'budget': '⏚⎍⎅☌⟒⏁',
    'timeline': '⏁⟟⋔⟒⌰⟟⋏⟒',
    'floatValueReference': '⎎⌰⍜⏃⏁ ⍀⟒⎎⟒⍀⟒⋏☊⟒',
    'floatValueReferenceDesc': '⋔⟒⏁⍀⟟☊⌇ ⌇⎍⋔⋔⏃⍀⊬',
    'symbol': '⌇⊬⋔⏚⍜⌰',
    'range': '⍀⏃⋏☌⟒',
    'interpretation': '⟟⋏⏁⟒⍀⌿⍀⟒⏁',
    'doCalculus': '⎅⍜-☊⏃⌰☊',
    'doCalculusDescription': '⌿(⊬ | ⎅⍜(⌖ = ⌖))',
    'doCalculusNotation': '⎅⍜ ⋏⍜⏁⏃⏁⟟⍜⋏',
    'targetVariable': '⏁⏃⍀☌⟒⏁ ⎐⏃⍀',
    'primaryEffects': '⌿⍀⟟⋔⏃⍀⊬ ⟒⎎⎎⟒☊⏁⌇',
    'secondaryEffects': '⌇⟒☊⍜⋏⎅⏃⍀⊬ ⟒⎎⎎⟒☊⏁⌇',
    'riskAssessment': '⍀⟟⌇☍ ⏃⌇⌇⟒⌇⌇',
    'baselineRisk': '⏚⏃⌇⟒⌰⟟⋏⟒ ⍀⟟⌇☍',
    'interventionRisk': '⌿⍜⌇⏁ ⍀⟟⌇☍',
    'risk': '⍀⟟⌇☍',
    
    // Operation Cases
    'operationCases.title': '⍜⌿⟒⍀⏃⏁⟟⍜⋏ ☊⏃⌇⟒⌇',
    'operationCases.description': '⎎⟟⎐⟒ ☊⏃⌇⟒⌇ ⎎⍀⍜⋔ ⏁⏚⋔ ⏁⍜ ⎅⟒☊⟟⌇⟟⍜⋏',
    'operationCases.summaryTable': '☊⏃⌇⟒ ⌇⎍⋔⋔⏃⍀⊬',
    'case1.title': '☊⏃⌇⟒ 1: ⋏⍜⍀⋔⏃⌰ ⏚⏃⌇⟒⌰⟟⋏⟒',
    'case1.scenario': '⏁⏚⋔ ⌇⏁⏃⍀⏁⎍⌿ ⏁⍜ ⌇⏁⟒⏃⎅⊬ ⌇⏁⏃⏁⟒',
    'case1.trainingGoal': '⟒⌇⏁⏃⏚⌰⟟⌇⊑ ⏚⏃⌇⟒⌰⟟⋏⟒ ⎍⋏⎅⟒⍀⌇⏁⏃⋏⎅⟟⋏☌',
    'case2.title': '☊⏃⌇⟒ 2: ⏚⟒⏃⍀⟟⋏☌ ⍙⟒⏃⍀ ⎅⟒⏁⟒☊⏁⟟⍜⋏',
    'case2.scenario': '⟒⏃⍀⌰⊬ ⍙⏃⍀⋏⟟⋏☌ ⌇⎍☊☊⟒⌇⌇',
    'case2.trainingGoal': '⎅⟒⋔⍜⋏⌇⏁⍀⏃⏁⟒ ⟒⏃⍀⌰⊬ ⍙⏃⍀⋏⟟⋏☌',
    'case3.title': '☊⏃⌇⟒ 3: ⏁⊑⟒⍀⋔⏃⌰ ⟒⋔⟒⍀☌⟒⋏☊⊬',
    'case3.scenario': '⟟⋔⋔⟒⎅⟟⏃⏁⟒ ⟟⋏⏁⟒⍀⎐⟒⋏⏁⟟⍜⋏',
    'case3.trainingGoal': '⟒⋔⟒⍀☌⟒⋏☊⊬ ⍀⟒⌇⌿⍜⋏⌇⟒ ⌿⏃⏁⊑⍙⏃⊬',
    'case4.title': '☊⏃⌇⟒ 4: ⊑⊬⎅⍀⏃⎍⌰⟟☊ ⌰⟒⏃☍',
    'case4.scenario': '⍀⍜⍜⏁ ☊⏃⎍⌇⟒ ⏁⍀⏃☊⟟⋏☌',
    'case4.trainingGoal': '☊⏃⎍⌇⏃⌰ ⌿⏃⏁⊑⍙⏃⊬ ⏁⍀⏃☊⟟⋏☌',
    'case5.title': '☊⏃⌇⟒ 5: ⋔⎍⌰⏁⟟-⎎⏃⎍⌰⏁',
    'case5.scenario': '☊⍜⋔⌿⌰⟒⌖ ⎅⟒☊⟟⌇⟟⍜⋏',
    'case5.trainingGoal': '⋔⎍⌰⏁⟟-⎎⏃⎍⌰⏁ ⎅⟟⏃☌⋏⍜⌇⟟⌇',
    
    // General
    'general.loading': '⌰⍜⏃⎅⟟⋏☌...',
    'general.error': '⟒⍀⍀⍜⍀',
    'general.success': '⌇⎍☊☊⟒⌇⌇',
    'general.cancel': '☊⏃⋏☊⟒⌰',
    'general.confirm': '☊⍜⋏⎎⟟⍀⋔',
    'general.save': '⌇⏃⎐⟒',
    'general.close': '☊⌰⍜⌇⟒',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  alien: '⏃⌰⟟⟒⋏',
};
