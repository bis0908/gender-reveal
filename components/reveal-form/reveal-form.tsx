"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FamilyDetailsForm } from "@/components/reveal-form/family-details-form";
import { AnimationSettingsForm } from "@/components/reveal-form/animation-settings-form";
import { GeneratedLinkCard } from "@/components/reveal-form/generated-link-card";
import { formSchema, type FormValues } from "@/lib/schemas/reveal-form-schema";
import { useTranslation } from "@/lib/i18n/context";

export function RevealForm() {
	const { toast } = useToast();
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [generatedLink, setGeneratedLink] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>("details");
	const tabsRef = useRef<HTMLDivElement>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			motherName: "",
			fatherName: "",
			babyName: "",
			gender: "boy",
			message: "",
			animationType: "confetti",
			countdownTime: 5,
			isMultiple: false,
			babiesInfo: [],
		},
	});

	// 다태아 여부에 따라 필드 초기화
	const isMultiple = form.watch("isMultiple");

	useEffect(() => {
		// 다태아 여부가 변경되면 필드 초기화
		if (isMultiple) {
			const babiesInfo = form.getValues().babiesInfo;
			if (!babiesInfo || babiesInfo.length < 2) {
				form.setValue("babiesInfo", [
					{ name: "", gender: "boy" },
					{ name: "", gender: "girl" },
				]);
			}
		}
	}, [isMultiple, form]);

	const onSubmit = async (data: FormValues) => {
		setLoading(true);

		try {
			// 필수 정보 추출 (다태아 여부에 따라 다름)
			const essentialData = {
				motherName: data.motherName,
				fatherName: data.fatherName,
				animationType: data.animationType,
				countdownTime: data.countdownTime,
				isMultiple: data.isMultiple,
				...(!data.isMultiple
					? { babyName: data.babyName, gender: data.gender }
					: { babiesInfo: data.babiesInfo }),
				...(data.dueDate && { dueDate: data.dueDate }),
				...(data.message && { message: data.message }),
			};

			// API를 통해 토큰 생성
			const response = await fetch("/api/generate-token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(essentialData),
			});

			// 응답 확인
			const responseText = await response.text();

			if (!response.ok) {
				let errorMessage = t('errors.tokenGenerationFailed');
				try {
					const errorData = JSON.parse(responseText);
					if (errorData.error) {
						errorMessage = errorData.error;
					}
				} catch (parseError) {
					console.error("[ERROR] 오류 응답 파싱 실패:", parseError);
				}
				throw new Error(errorMessage);
			}

			// 응답이 비어있는지 확인
			if (!responseText || responseText.trim() === "") {
				throw new Error(t('errors.emptyResponse'));
			}

			// JSON 응답 파싱
			let tokenData: { token?: string };
			try {
				tokenData = JSON.parse(responseText);
			} catch (parseError) {
				console.error(
					"[ERROR] JSON 파싱 오류:",
					parseError,
					"응답 텍스트:",
					responseText,
				);
				throw new Error(t('errors.parsingError'));
			}

			if (!tokenData || !tokenData.token) {
				throw new Error(t('errors.invalidToken'));
			}

			const token = tokenData.token;

			// Create URL with the token
			const revealUrl = `${window.location.origin}/reveal?token=${encodeURIComponent(token)}`;

			// Save the generated link
			setGeneratedLink(revealUrl);

			toast({
				title: t('success.linkGenerated'),
				description: t('success.linkGeneratedDescription'),
				variant: "default",
			});
		} catch (error) {
			console.error("[ERROR] 토큰 생성 과정 오류:", error);
			toast({
				title: t('common.error'),
				description:
					error instanceof Error
						? error.message
						: t('errors.serverError'),
				variant: "destructive",
			});
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	// 탭 변경 시 스크롤 처리 함수
	const handleTabChange = (value: string) => {
		setActiveTab(value);

		// 스크롤을 탭 리스트 상단으로 이동 (header 높이를 뺀 만큼)
		setTimeout(() => {
			const tabsList = document.querySelector(".tabs-list");
			if (tabsList) {
				const headerHeight =
					document.querySelector("header")?.offsetHeight || 0;
				window.scrollTo({
					top:
						tabsList.getBoundingClientRect().top +
						window.scrollY -
						headerHeight,
					behavior: "smooth",
				});
			}
		}, 100);
	};

	// 1단계에서 2단계로 넘어갈 때 필수 필드 검사
	const validateFirstStep = () => {
		const motherName = form.getValues("motherName");
		const fatherName = form.getValues("fatherName");

		let isValid = true;
		const errors: { [key: string]: boolean } = {};

		if (!motherName || motherName.trim() === "") {
			form.setError("motherName", { message: t('errors.motherNameRequired') });
			errors.motherName = true;
			isValid = false;
		}

		if (!fatherName || fatherName.trim() === "") {
			form.setError("fatherName", { message: t('errors.fatherNameRequired') });
			errors.fatherName = true;
			isValid = false;
		}

		const isMultiple = form.getValues("isMultiple");
		if (!isMultiple) {
			const babyName = form.getValues("babyName");
			if (!babyName || babyName.trim() === "") {
				form.setError("babyName", { message: t('errors.babyNameRequired') });
				errors.babyName = true;
				isValid = false;
			}
		} else {
			const babiesInfo = form.getValues("babiesInfo");
			if (
				!babiesInfo ||
				babiesInfo.length < 2 ||
				babiesInfo.some((baby) => !baby.name || baby.name.trim() === "")
			) {
				form.setError("babiesInfo", {
					message: t('errors.allBabyNamesRequired'),
				});
				errors.babiesInfo = true;
				isValid = false;
			}
		}

		if (!isValid) {
			toast({
				title: t('errors.validationError'),
				description: t('errors.required'),
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	// 다음 단계로 이동 처리
	const handleNextStep = () => {
		if (validateFirstStep()) {
			handleTabChange("animation");
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<Tabs
					defaultValue="details"
					className="w-full"
					value={activeTab}
					onValueChange={handleTabChange}
					ref={tabsRef}
				>
					<TabsList className="grid w-full grid-cols-2 rounded-xl mb-4 p-1.5 bg-gradient-to-r from-baby-blue-light/50 to-baby-pink-light/50 h-auto min-h-[60px] tabs-list">
						<TabsTrigger
							value="details"
							className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-lg py-3.5 transition-all duration-300 flex items-center gap-2 h-full"
						>
							<span className="inline-flex items-center justify-center bg-baby-blue/20 w-6 h-6 rounded-full text-sm font-bold">
								1
							</span>
							{t('form.familyInfo')}
						</TabsTrigger>
						<TabsTrigger
							value="animation"
							className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:font-semibold data-[state=active]:shadow-md rounded-lg py-3.5 transition-all duration-300 flex items-center gap-2 h-full"
						>
							<span className="inline-flex items-center justify-center bg-baby-pink/20 w-6 h-6 rounded-full text-sm font-bold">
								2
							</span>
							{t('form.animationSettings')}
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="details"
						className="space-y-6 pt-4 border border-baby-blue-light/50 rounded-xl p-6"
					>
						<FamilyDetailsForm form={form} onNextStep={handleNextStep} />
					</TabsContent>

					<TabsContent
						value="animation"
						className="space-y-6 pt-4 border border-baby-pink-light/50 rounded-xl p-6"
					>
						<AnimationSettingsForm
							form={form}
							onPreviousStep={() => handleTabChange("details")}
							loading={loading}
							onSubmit={async () => {
								// 수동으로 form.handleSubmit 호출하여 검증 및 제출 처리
								return form.handleSubmit(async (data) => {
									try {
										await onSubmit(data);
									} catch (err) {
										console.error("[ERROR] 폼 제출 처리 중 오류:", err);
										if (err instanceof Error) {
											console.error("[ERROR] 오류 메시지:", err.message);
											console.error("[ERROR] 오류 스택:", err.stack);
										}
									}
								})();
							}}
						/>

						{generatedLink && (
							<GeneratedLinkCard generatedLink={generatedLink} />
						)}
					</TabsContent>
				</Tabs>
			</form>
		</Form>
	);
}
