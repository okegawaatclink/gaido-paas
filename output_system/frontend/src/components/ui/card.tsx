/**
 * Cardコンポーネント
 *
 * shadcn/ui互換のカードコンポーネント。
 * コンテンツをカード形式で表示するためのコンポーネント群を提供する。
 *
 * 提供するコンポーネント:
 * - Card: カードのルートコンテナ
 * - CardHeader: カードのヘッダーセクション（タイトル・説明を含む）
 * - CardTitle: カードのタイトル
 * - CardDescription: カードの説明文
 * - CardContent: カードのメインコンテンツ
 * - CardFooter: カードのフッターセクション
 *
 * 参考: https://ui.shadcn.com/docs/components/card
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cardコンポーネント
 *
 * カードの外側のコンテナ。ボーダー・背景・シャドウを適用する。
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeaderコンポーネント
 *
 * カードのヘッダーセクション。CardTitleとCardDescriptionを含む。
 * パディングとフレックスレイアウトを適用する。
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitleコンポーネント
 *
 * カードのタイトルテキスト。セマンティックにはh3タグとして実装する。
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescriptionコンポーネント
 *
 * カードの説明文テキスト。タイトルの補足情報を表示する。
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContentコンポーネント
 *
 * カードのメインコンテンツエリア。
 * ヘッダーの下に配置され、主要なコンテンツを含む。
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooterコンポーネント
 *
 * カードのフッターセクション。
 * ボタンやアクションリンクを配置するために使用する。
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
