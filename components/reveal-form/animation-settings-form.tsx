"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimationSelection } from "@/components/animation-selection";
import { ArrowLeftIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { FormValues } from "@/lib/schemas/reveal-form-schema";

interface AnimationSettingsFormProps {
	form: UseFormReturn<FormValues>;
	onPreviousStep: () => void;
	loading: boolean;
	onSubmit: () => Promise<void>;
}

export function AnimationSettingsForm({
	form,
	onPreviousStep,
	loading,
	onSubmit,
}: AnimationSettingsFormProps) {
	const handleSubmit = async () => {
		try {
			// 폼 검증 상태 확인
			const isValid = await form.trigger();

			if (isValid) {
				await onSubmit();
			} else {
				// 폼 오류 메시지를 사용자에게 표시
				const errorMessages = Object.entries(form.formState.errors)
					.map(([field, error]) => `${field}: ${error.message}`)
					.join(", ");
			}
		} catch (error) {
			console.error("[ERROR] 제출 처리 중 오류 발생:", error);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center mb-4">
				<h3 className="text-lg font-semibold text-gray-800">
					2단계: 애니메이션 설정
				</h3>
				<p className="text-sm text-gray-500">
					Gender Reveal에 사용할 애니메이션을 선택해주세요
				</p>
			</div>
			<FormField
				control={form.control}
				name="animationType"
				render={({ field }) => (
					<FormItem>
						<FormLabel>공개 애니메이션</FormLabel>
						<FormControl>
							<AnimationSelection
								value={field.value}
								onChange={field.onChange}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="countdownTime"
				render={({ field }) => (
					<FormItem className="mt-6">
						<FormLabel>카운트다운 시간 (초)</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={3}
								max={10}
								{...field}
								onChange={(e) =>
									field.onChange(Number.parseInt(e.target.value))
								}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* <div className="flex justify-between pt-4"> */}
			<div className="flex flex-col-reverse sm:flex-row sm:justify-between  gap-3 pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onPreviousStep}
					className="flex items-center gap-2 w-full sm:w-auto"
				>
					<ArrowLeftIcon className="h-4 w-4" />
					이전
				</Button>

				<Button
					type="button"
					size="lg"
					disabled={loading}
					className="w-full sm:w-auto"
					onClick={handleSubmit}
				>
					{loading ? "생성 중..." : "Gender reveal 만들기"}
				</Button>
			</div>
		</div>
	);
}
